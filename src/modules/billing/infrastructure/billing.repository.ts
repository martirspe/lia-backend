import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Subscription, BillingProvider, SubStatus, Tenant } from '@prisma/client';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) { }

  getSubscription(tenantId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { tenantId } });
  }

  upsertSubscription(data: {
    tenantId: string;
    provider: BillingProvider;
    providerSubId: string;
    status: SubStatus;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }) {
    return this.prisma.subscription.upsert({
      where: { tenantId: data.tenantId },
      create: data,
      update: data,
    });
  }

  updateStatus(
    tenantId: string,
    fields: Partial<Pick<Subscription, 'status' | 'currentPeriodEnd' | 'cancelAtPeriodEnd' | 'providerSubId'>>,
  ) {
    return this.prisma.subscription.update({ where: { tenantId }, data: fields });
  }

  getTenant(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  setTenantBillingCustomer(tenantId: string, customerId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { billingCustomerId: customerId },
    });
  }

  findByProviderSubId(providerSubId: string, provider: BillingProvider) {
    return this.prisma.subscription.findFirst({ where: { providerSubId, provider } });
  }
}