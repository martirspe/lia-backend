import {
  Body,
  Controller,
  Delete,
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
import { CreateSubscriptionDto } from '../application/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../application/dto/update-subscription.dto';
import { SubscribeUseCase } from '../application/use-cases/subscribe.usecase';
import { UpdateSubscriptionUseCase } from '../application/use-cases/update-subscription.usecase';
import { CancelSubscriptionUseCase } from '../application/use-cases/cancel-subscription.usecase';
import { GetSubscriptionUseCase } from '../application/use-cases/get-subscription.usecase';

@Controller('billing')
@UsePipes(ValidationPipe)
@UseGuards(AuthGuard, RolesGuard)
export class BillingController {
  constructor(
    private readonly subscribeUC: SubscribeUseCase,
    private readonly updateUC: UpdateSubscriptionUseCase,
    private readonly cancelUC: CancelSubscriptionUseCase,
    private readonly getUC: GetSubscriptionUseCase,
  ) { }

  @Get('subscription')
  @Roles('OWNER', 'ADMIN')
  async get(@Headers('x-tenant-id') tenantId: string) {
    return this.getUC.execute({ tenantId });
  }

  @Post('subscription')
  @Roles('OWNER')
  @HttpCode(201)
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscribeUC.execute({ tenantId, planId: dto.planId });
  }

  @Post('subscription/plan')
  @Roles('OWNER')
  async changePlan(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.updateUC.execute({ tenantId, planId: dto.planId });
  }

  @Delete('subscription')
  @Roles('OWNER')
  async cancel(@Headers('x-tenant-id') tenantId: string) {
    return this.cancelUC.execute({ tenantId });
  }
}
