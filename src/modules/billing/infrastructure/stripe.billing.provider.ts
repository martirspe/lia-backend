import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingProvider } from '../domain/billing.provider';

@Injectable()
export class StripeBillingProvider extends BillingProvider {
  private readonly logger = new Logger(StripeBillingProvider.name);
  private stripe: any;
  private webhookSecret?: string;

  constructor(private readonly config: ConfigService) {
    super();
    const key = this.config.get<string>('stripe.secretKey');
    this.webhookSecret = this.config.get<string>('stripe.webhookSecret') || undefined;
    // Import dinámico para evitar fallos si Stripe no está instalado en build
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe').default;
    this.stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  }

  isEnabled(): boolean {
    return true;
  }

  async ensureCustomer(params: {
    tenantId: string;
    tenantName: string;
    ownerEmail: string;
  }): Promise<string | null> {
    const customer = await this.stripe.customers.create({
      name: params.tenantName,
      email: params.ownerEmail,
      metadata: { tenantId: params.tenantId },
    });
    return customer.id as string;
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: params.cancelUrl,
      allow_promotion_codes: true,
    });
    return { url: session.url as string };
  }

  async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
    return { url: session.url as string };
  }

  async verifyAndParseWebhook(params: {
    signature?: string;
    rawBody: string;
  }): Promise<{ type: string; data: any }> {
    // Si no hay webhook secret, aceptar payload sin verificar (modo dev)
    if (!this.webhookSecret) {
      try {
        const evt = JSON.parse(params.rawBody);
        return { type: evt.type, data: evt.data?.object };
      } catch (e) {
        this.logger.warn('Webhook without secret: invalid JSON body');
        return { type: 'unknown', data: {} };
      }
    }
    try {
      const event = this.stripe.webhooks.constructEvent(
        params.rawBody,
        params.signature,
        this.webhookSecret,
      );
      return { type: event.type, data: event.data?.object };
    } catch (err: any) {
      this.logger.error(`Stripe webhook signature verification failed: ${err?.message || err}`);
      throw err;
    }
  }
}