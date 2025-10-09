import { BillingProvider, SubStatus } from '@prisma/client';

export interface ProviderSubscriptionResult {
  provider: BillingProvider;
  providerSubId: string;
  customerId: string;
  status: SubStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface ProviderWebhookEvent {
  provider: BillingProvider;
  type: string;
  providerSubId?: string;
  status?: SubStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  customerId?: string;
}

export interface PaymentProvider {
  readonly provider: BillingProvider;
  ensureCustomer(params: { tenantId: string; tenantName: string }): Promise<{ customerId: string }>;
  createOrUpdateSubscription(params: {
    tenantId: string;
    tenantName: string;
    planId: string;
    currentProviderSubId?: string;
  }): Promise<ProviderSubscriptionResult>;
  cancelAtPeriodEnd(params: { providerSubId: string }): Promise<ProviderSubscriptionResult>;
  parseWebhook(rawBody: string, headers: Record<string, any>): Promise<ProviderWebhookEvent | null>;
}