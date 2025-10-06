import { Injectable, Logger } from '@nestjs/common';
import { BillingProvider } from '../domain/billing.provider';

@Injectable()
export class NoopBillingProvider extends BillingProvider {
  private readonly logger = new Logger(NoopBillingProvider.name);

  isEnabled(): boolean {
    return false;
  }

  async ensureCustomer(): Promise<string | null> {
    this.logger.debug('Billing disabled: ensureCustomer noop');
    return null;
  }

  async createCheckoutSession(): Promise<{ url: string }> {
    this.logger.debug('Billing disabled: createCheckoutSession noop');
    return { url: '' };
  }

  async createPortalSession(): Promise<{ url: string }> {
    this.logger.debug('Billing disabled: createPortalSession noop');
    return { url: '' };
  }

  async verifyAndParseWebhook(): Promise<{ type: string; data: any }> {
    this.logger.debug('Billing disabled: webhook noop');
    return { type: 'noop', data: {} };
  }
}