import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingProvider, SubStatus } from '@prisma/client';
import {
  PaymentProvider,
  ProviderSubscriptionResult,
  ProviderWebhookEvent,
} from '../../domain/payment-provider.interface';

interface PayPalSubscription {
  id: string;
  status: string;
  billing_info?: {
    next_billing_time?: string;
  };
}

@Injectable()
export class PaypalProvider implements PaymentProvider {
  readonly provider = BillingProvider.PAYPAL;
  private readonly logger = new Logger(PaypalProvider.name);

  constructor(private readonly config: ConfigService) { }

  private baseUrl() {
    return this.config.get('paypal.env') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async accessToken(): Promise<string> {
    const clientId = this.config.get<string>('paypal.clientId') || '';
    const clientSecret = this.config.get<string>('paypal.clientSecret') || '';
    if (!clientId || !clientSecret) throw new Error('PayPal credentials missing');

    const res = await fetch(`${this.baseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error('PayPal auth failed');
    const data = await res.json();
    return data.access_token;
  }

  async ensureCustomer(params: { tenantId: string; tenantName: string }) {
    // PayPal buyer is user-driven. Devolvemos un id lógico.
    return { customerId: `paypal:${params.tenantId}` };
  }

  private mapStatus(ppStatus: string): SubStatus {
    switch (ppStatus) {
      case 'ACTIVE':
        return SubStatus.ACTIVE;
      case 'SUSPENDED':
        return SubStatus.PAST_DUE;
      case 'CANCELLED':
        return SubStatus.CANCELED;
      case 'APPROVAL_PENDING':
      case 'APPROVED':
        return SubStatus.INCOMPLETE;
      default:
        return SubStatus.INCOMPLETE;
    }
  }

  private computePeriodEnd(sub: PayPalSubscription): Date {
    if (sub.billing_info?.next_billing_time) {
      return new Date(sub.billing_info.next_billing_time);
    }
    // fallback 30 días
    return new Date(Date.now() + 30 * 24 * 3600 * 1000);
  }

  async createOrUpdateSubscription(params: {
    tenantId: string;
    tenantName: string;
    planId: string;
    currentProviderSubId?: string;
  }): Promise<ProviderSubscriptionResult> {
    // Simplificación: siempre crear nueva suscripción (realmente requires buyer approval).
    const token = await this.accessToken();

    const body = {
      plan_id: params.planId,
      custom_id: params.tenantId,
      application_context: {
        brand_name: params.tenantName,
        user_action: 'SUBSCRIBE_NOW',
      },
    };

    const res = await fetch(`${this.baseUrl()}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `sub-${Date.now()}-${Math.random()}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      this.logger.error(`PayPal create subscription error: ${txt}`);
      throw new Error('PayPal subscription creation failed');
    }
    const data = (await res.json()) as PayPalSubscription;
    const status = this.mapStatus(data.status);
    const periodEnd = this.computePeriodEnd(data);

    return {
      provider: BillingProvider.PAYPAL,
      providerSubId: data.id,
      customerId: `paypal:${params.tenantId}`,
      status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    };
  }

  async cancelAtPeriodEnd(params: { providerSubId: string }): Promise<ProviderSubscriptionResult> {
    const token = await this.accessToken();
    // PayPal cancela de inmediato; no hay "al final del periodo" nativo simple
    const res = await fetch(
      `${this.baseUrl()}/v1/billing/subscriptions/${params.providerSubId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      },
    );
    if (!res.ok) {
      const txt = await res.text();
      this.logger.warn(`PayPal cancel status=${res.status} body=${txt}`);
    }

    return {
      provider: BillingProvider.PAYPAL,
      providerSubId: params.providerSubId,
      customerId: 'paypal:unknown',
      status: SubStatus.CANCELED,
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: true,
    };
  }

  async parseWebhook(rawBody: string, headers: Record<string, any>): Promise<ProviderWebhookEvent | null> {
    const webhookId = this.config.get<string>('paypal.webhookId');
    if (!webhookId) return null;

    const transmissionId = headers['paypal-transmission-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionTime = headers['paypal-transmission-time'];

    if (!transmissionId || !transmissionSig) return null;

    const token = await this.accessToken();
    const verifyRes = await fetch(`${this.baseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody || '{}'),
      }),
    });

    if (!verifyRes.ok) {
      this.logger.warn(`PayPal webhook verify failed status=${verifyRes.status}`);
      return null;
    }
    const verify = await verifyRes.json();
    if (verify.verification_status !== 'SUCCESS') {
      this.logger.warn('PayPal webhook invalid signature');
      return null;
    }

    const event = JSON.parse(rawBody || '{}');
    const eventType = event.event_type as string;

    if (event.resource?.id && eventType.startsWith('BILLING.SUBSCRIPTION.')) {
      const status = event.resource?.status;
      return {
        provider: BillingProvider.PAYPAL,
        type: eventType,
        providerSubId: event.resource.id,
        status: this.mapStatus(status),
        currentPeriodEnd: this.computePeriodEnd(event.resource),
        cancelAtPeriodEnd: status === 'CANCELLED',
      };
    }

    return {
      provider: BillingProvider.PAYPAL,
      type: eventType,
    };
  }
}