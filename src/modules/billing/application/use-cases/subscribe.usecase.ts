import { Injectable, BadRequestException } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { PaypalProvider } from '../../infrastructure/providers/paypal.provider';
import { BillingProvider } from '@prisma/client';

@Injectable()
export class SubscribeUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly paypal: PaypalProvider,
  ) { }

  async execute(params: { tenantId: string; planId: string }) {
    const tenant = await this.repo.getTenant(params.tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');

    const existing = await this.repo.getSubscription(tenant.id);
    const result = await this.paypal.createOrUpdateSubscription({
      tenantId: tenant.id,
      tenantName: tenant.name,
      planId: params.planId,
      currentProviderSubId: existing?.providerSubId,
    });

    if (!tenant.billingCustomerId) {
      await this.repo.setTenantBillingCustomer(tenant.id, result.customerId);
    }

    const sub = await this.repo.upsertSubscription({
      tenantId: tenant.id,
      provider: BillingProvider.PAYPAL,
      providerSubId: result.providerSubId,
      status: result.status,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    });

    return {
      provider: sub.provider,
      status: sub.status,
      providerSubId: sub.providerSubId,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }
}