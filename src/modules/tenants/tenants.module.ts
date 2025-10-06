import { Module, Global } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantsController } from './presentation/tenants.controller';
import { TenantsRepository } from './infrastructure/tenants.repository';
import { TenantBillingService } from './application/services/tenant-billing.service';
import { CreateTenantUseCase } from './application/use-cases/create-tenant.usecase';
import { UpdateTenantUseCase } from './application/use-cases/update-tenant.usecase';
import { DeleteTenantUseCase } from './application/use-cases/delete-tenant.usecase';
import { BcryptService } from '../auth/infrastructure/bcrypt.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [
    TenantsRepository,
    TenantBillingService,
    CreateTenantUseCase,
    UpdateTenantUseCase,
    DeleteTenantUseCase,
    BcryptService,
  ],
  exports: [TenantsRepository],
})
export class TenantsModule {}
