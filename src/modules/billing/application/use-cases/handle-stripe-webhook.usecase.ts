import { Injectable, Logger } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { BillingProvider } from '../../domain/billing.provider';
import { SubStatus } from '@prisma/client';

@Injectable()
export class HandleStripeWebhookUseCase {
  private readonly logger = new Logger(HandleStripeWebhookUseCase.name);

  constructor(
    private readonly repo: BillingRepository,
    private readonly provider: BillingProvider,
  ) {}

  private mapStatus(s: string): SubStatus {
    switch (s) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
        return 'CANCELED';
      case 'incomplete':
      case 'incomplete_expired':
        return 'INCOMPLETE';
      default:
        return 'INCOMPLETE';
    }
  }

  async execute(params: { signature?: string; rawBody: string }) {
    if (!this.provider.isEnabled()) {
      this.logger.debug('Stripe disabled; ignoring webhook');
      return { ok: true, ignored: true };
    }

    const evt = await this.provider.verifyAndParseWebhook({
      signature: params.signature,
      rawBody: params.rawBody,
    });

    // Manejo de eventos relevantes
    if (evt.type?.startsWith('customer.subscription')) {
      const sub = evt.data;
      const tenantId = sub?.metadata?.tenantId || sub?.metadata?.tenant_id;
      if (!tenantId) {
        this.logger.warn('Subscription event without tenantId metadata');
        return { ok: true };
      }
      const status = this.mapStatus(sub?.status || 'incomplete');
      const periodEndSec = sub?.current_period_end || Math.floor(Date.now() / 1000);
      const currentPeriodEnd = new Date(periodEndSec * 1000);
      await this.repo.upsertSubscription({
        tenantId,
        stripeSubId: sub?.id,
        status,
        currentPeriodEnd,
      });
      return { ok: true };
    }

    this.logger.debug(`Unhandled webhook type: ${evt.type}`);
    return { ok: true };
  }
}