import { Injectable, Logger } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { PaypalProvider } from '../../infrastructure/providers/paypal.provider';
import { BillingProvider } from '@prisma/client';

@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);
  constructor(
    private readonly repo: BillingRepository,
    private readonly paypal: PaypalProvider,
  ) { }

  async execute(params: { provider: BillingProvider; rawBody: string; headers: Record<string, any> }) {
    if (params.provider !== BillingProvider.PAYPAL) return { ok: true };

    const event = await this.paypal.parseWebhook(params.rawBody, params.headers);
    if (!event) return { ok: true };

    if (event.providerSubId && event.status) {
      const sub = await this.repo.findByProviderSubId(event.providerSubId, BillingProvider.PAYPAL);
      if (sub) {
        await this.repo.updateStatus(sub.tenantId, {
          status: event.status,
          currentPeriodEnd: event.currentPeriodEnd,
          cancelAtPeriodEnd: event.cancelAtPeriodEnd,
        });
      }
    }
    return { ok: true };
  }
}