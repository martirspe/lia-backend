import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './presentation/billing.controller';
import { BillingRepository } from './infrastructure/billing.repository';
import { EnsureCustomerUseCase } from './application/use-cases/ensure-customer.usecase';
import { CreateCheckoutSessionUseCase } from './application/use-cases/create-checkout-session.usecase';
import { CreatePortalSessionUseCase } from './application/use-cases/create-portal-session.usecase';
import { GetSubscriptionUseCase } from './application/use-cases/get-subscription.usecase';
import { HandleStripeWebhookUseCase } from './application/use-cases/handle-stripe-webhook.usecase';
import { BillingProvider } from './domain/billing.provider';
import { BillingWebhookController } from './presentation/billing-webhook.controller';
import { StripeBillingProvider } from './infrastructure/stripe.billing.provider';
import { NoopBillingProvider } from './infrastructure/noop.billing.provider';


@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [
    BillingRepository,
    EnsureCustomerUseCase,
    CreateCheckoutSessionUseCase,
    CreatePortalSessionUseCase,
    GetSubscriptionUseCase,
    HandleStripeWebhookUseCase,
    {
      provide: BillingProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const enabled = !!config.get<boolean>('stripe.enabled');
        const key = config.get<string>('stripe.secretKey');
        if (enabled && key) {
          return new StripeBillingProvider(config);
        }
        return new NoopBillingProvider();
      },
    },
  ],
  exports: [BillingRepository, BillingProvider],
})
export class BillingModule { }
