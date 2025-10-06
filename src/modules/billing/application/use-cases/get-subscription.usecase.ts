import { Injectable } from '@nestjs/common';
import { BillingRepository } from '../../infrastructure/billing.repository';

@Injectable()
export class GetSubscriptionUseCase {
  constructor(private readonly repo: BillingRepository) {}

  execute(tenantId: string) {
    return this.repo.getSubscription(tenantId);
  }
}