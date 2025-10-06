import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantBillingService {
  private readonly logger = new Logger(TenantBillingService.name);
  constructor(private readonly config: ConfigService) {}

  /**
   * Crea un Customer en Stripe si STRIPE_SECRET_KEY está configurado.
   * Devuelve stripeCustomerId o null si no hay configuración.
   */
  async ensureStripeCustomer(params: {
    tenantId: string;
    tenantName: string;
    ownerEmail: string;
  }): Promise<string | null> {
    const key = this.config.get<string>('stripe.secretKey');
    if (!key) {
      this.logger.warn('Stripe secret key not set; skipping Stripe customer creation');
      return null;
    }
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    const customer = await stripe.customers.create({
      name: params.tenantName,
      email: params.ownerEmail,
      metadata: { tenantId: params.tenantId },
    });
    return customer.id;
  }
}