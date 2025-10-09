import { Injectable } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';

@Injectable()
export class GetSubscriptionUseCase {
  constructor(private readonly repo: BillingRepository) { }

  async execute(params: { tenantId: string }) {
    const sub = await this.repo.getSubscription(params.tenantId);
    if (!sub) return null;
    return {
      provider: sub.provider,
      status: sub.status,
      providerSubId: sub.providerSubId,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }
}