import { Injectable, BadRequestException } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { BillingProvider } from '../../domain/billing.provider';

@Injectable()
export class EnsureCustomerUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly provider: BillingProvider,
  ) {}

  async execute(params: { tenantId: string; tenantName: string; ownerEmail: string }) {
    if (!this.provider.isEnabled()) return null;

    const tenant = await this.repo.getTenantById(params.tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');

    if (tenant.stripeCustomerId) return tenant.stripeCustomerId;

    const customerId = await this.provider.ensureCustomer(params);
    if (!customerId) return null;

    await this.repo.setTenantStripeCustomerId(params.tenantId, customerId);
    return customerId;
  }
}