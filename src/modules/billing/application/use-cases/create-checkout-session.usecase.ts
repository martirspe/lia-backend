import { Injectable, BadRequestException } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';
import { BillingProvider } from '../../domain/billing.provider';

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly provider: BillingProvider,
  ) {}

  async execute(params: {
    tenantId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (!this.provider.isEnabled()) {
      return { url: '' };
    }

    const tenant = await this.repo.getTenantById(params.tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const ensured = await this.provider.ensureCustomer({
        tenantId: tenant.id,
        tenantName: tenant.name,
        ownerEmail: `${tenant.slug}@example.com`,
      });
      customerId = ensured || null;
      if (customerId) {
        await this.repo.setTenantStripeCustomerId(tenant.id, customerId);
      }
    }
    if (!customerId) throw new BadRequestException('Customer not available');

    return this.provider.createCheckoutSession({
      customerId,
      priceId: params.priceId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    });
  }
}