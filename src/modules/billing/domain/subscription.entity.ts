import { BillingProvider, SubStatus } from '@prisma/client';

export class SubscriptionEntity {
  constructor(
    public readonly tenantId: string,
    public readonly provider: BillingProvider,
    public readonly providerSubId: string,
    public readonly status: SubStatus,
    public readonly currentPeriodEnd: Date,
    public readonly cancelAtPeriodEnd: boolean,
  ) {
    if (!tenantId) throw new Error('tenantId required');
    if (!providerSubId) throw new Error('providerSubId required');
  }
}