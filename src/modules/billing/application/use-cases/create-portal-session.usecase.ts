import { Injectable, BadRequestException } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { BillingProvider } from '../../domain/billing.provider';

@Injectable()
export class CreatePortalSessionUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly provider: BillingProvider,
  ) {}

  async execute(params: { tenantId: string; returnUrl: string }) {
    if (!this.provider.isEnabled()) {
      return { url: '' };
    }

    const tenant = await this.repo.getTenantById(params.tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');
    if (!tenant.stripeCustomerId) throw new BadRequestException('Tenant has no Stripe customer');

    return this.provider.createPortalSession({
      customerId: tenant.stripeCustomerId,
      returnUrl: params.returnUrl,
    });
  }
}