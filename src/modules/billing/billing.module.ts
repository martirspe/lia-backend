import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { BillingRepository } from './infrastructure/billing.repository';
import { PaypalProvider } from './infrastructure/providers/paypal.provider';
import { SubscribeUseCase } from './application/use-cases/subscribe.usecase';
import { UpdateSubscriptionUseCase } from './application/use-cases/update-subscription.usecase';
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription.usecase';
import { GetSubscriptionUseCase } from './application/use-cases/get-subscription.usecase';
import { ProcessWebhookUseCase } from './application/use-cases/process-webhook.usecase';
import { BillingController } from './presentation/billing.controller';
import { BillingWebhooksController } from './presentation/webhooks.controller';


@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BillingController, BillingWebhooksController],
  providers: [
    BillingRepository,
    PaypalProvider,
    SubscribeUseCase,
    UpdateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    GetSubscriptionUseCase,
    ProcessWebhookUseCase,
  ],
  exports: [BillingRepository],
})
export class BillingModule { }
