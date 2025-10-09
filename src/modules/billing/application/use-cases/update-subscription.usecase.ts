import { Injectable, BadRequestException } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { PaypalProvider } from '../../infrastructure/providers/paypal.provider';
import { BillingProvider } from '@prisma/client';

@Injectable()
export class UpdateSubscriptionUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly paypal: PaypalProvider,
  ) { }

  async execute(params: { tenantId: string; planId: string }) {
    const sub = await this.repo.getSubscription(params.tenantId);
    if (!sub) throw new BadRequestException('No subscription');

    if (sub.provider !== BillingProvider.PAYPAL) {
      throw new BadRequestException('Unsupported provider');
    }

    const tenant = await this.repo.getTenant(params.tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');

    const result = await this.paypal.createOrUpdateSubscription({
      tenantId: tenant.id,
      tenantName: tenant.name,
      planId: params.planId,
      currentProviderSubId: sub.providerSubId,
    });

    const updated = await this.repo.upsertSubscription({
      tenantId: tenant.id,
      provider: BillingProvider.PAYPAL,
      providerSubId: result.providerSubId,
      status: result.status,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    });

    return {
      provider: updated.provider,
      status: updated.status,
      providerSubId: updated.providerSubId,
      currentPeriodEnd: updated.currentPeriodEnd,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    };
  }
}