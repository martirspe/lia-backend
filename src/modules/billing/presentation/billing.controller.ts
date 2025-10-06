import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { CheckoutSessionDto } from '../application/dto/checkout-session.dto';
import { PortalSessionDto } from '../application/dto/portal-session.dto';
import { CreateCheckoutSessionUseCase } from '../application/use-cases/create-checkout-session.usecase';
import { CreatePortalSessionUseCase } from '../application/use-cases/create-portal-session.usecase';
import { GetSubscriptionUseCase } from '../application/use-cases/get-subscription.usecase';

@Controller('billing')
@UsePipes(ValidationPipe)
@UseGuards(AuthGuard, RolesGuard)
export class BillingController {
  constructor(
    private readonly checkoutUC: CreateCheckoutSessionUseCase,
    private readonly portalUC: CreatePortalSessionUseCase,
    private readonly getSubUC: GetSubscriptionUseCase,
  ) {}

  @Post('checkout-session')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(201)
  async checkout(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CheckoutSessionDto,
  ) {
    return this.checkoutUC.execute({
      tenantId,
      priceId: dto.priceId,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  @Post('portal-session')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(201)
  async portal(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: PortalSessionDto,
  ) {
    return this.portalUC.execute({ tenantId, returnUrl: dto.returnUrl });
  }

  @Get('subscription')
  @Roles('OWNER', 'ADMIN')
  async getSubscription(@Headers('x-tenant-id') tenantId: string) {
    return this.getSubUC.execute(tenantId);
  }
}
