import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SubStatus } from '@prisma/client';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  getTenantById(tenantId: string) {
    return this.prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  async setTenantStripeCustomerId(tenantId: string, stripeCustomerId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId },
    });
  }

  getSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({ where: { tenantId } });
  }

  async upsertSubscription(params: {
    tenantId: string;
    stripeSubId: string;
    status: SubStatus;
    currentPeriodEnd: Date;
  }) {
    return this.prisma.subscription.upsert({
      where: { tenantId: params.tenantId },
      update: {
        stripeSubId: params.stripeSubId,
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
      },
      create: {
        tenantId: params.tenantId,
        stripeSubId: params.stripeSubId,
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
      },
    });
  }
}