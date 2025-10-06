export abstract class BillingProvider {
  abstract isEnabled(): boolean;

  abstract ensureCustomer(params: {
    tenantId: string;
    tenantName: string;
    ownerEmail: string;
  }): Promise<string | null>;

  abstract createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  abstract createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;

  abstract verifyAndParseWebhook(params: {
    signature?: string;
    rawBody: string;
  }): Promise<{ type: string; data: any }>;
}