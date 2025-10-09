import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ForbiddenException,
} from '@nestjs/common';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Roles, Role } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateTenantUseCase } from '../application/use-cases/create-tenant.usecase';
import { UpdateTenantUseCase } from '../application/use-cases/update-tenant.usecase';
import { DeleteTenantUseCase } from '../application/use-cases/delete-tenant.usecase';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsRepository } from '../infrastructure/tenants.repository';

@Controller('tenants')
@UsePipes(ValidationPipe)
export class TenantsController {
  constructor(
    private readonly createUC: CreateTenantUseCase,
    private readonly updateUC: UpdateTenantUseCase,
    private readonly deleteUC: DeleteTenantUseCase,
    private readonly repo: TenantsRepository,
  ) {}

  // Registro público: crea tenant + usuario OWNER
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateTenantDto) {
    const result = await this.createUC.execute({
      name: dto.name,
      slug: dto.slug,
      ownerEmail: dto.ownerEmail,
      ownerPassword: dto.ownerPassword,
      plan: dto.plan,
    });
    return result;
  }

  // Info del tenant actual (auth requerida)
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Headers('x-tenant-id') tenantId: string) {
    const t = await this.repo.getById(tenantId);
    if (!t) return { error: 'Tenant not found' };
    return { id: t.id, name: t.name, slug: t.slug, plan: t.plan, billingCustomerId: t.billingCustomerId };
  }

  // Update (OWNER o ADMIN). Enforce path id == header tenantId.
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async update(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    if (tenantIdHeader !== id) throw new ForbiddenException('Mismatched tenant');
    const updated = await this.updateUC.execute({
      tenantId: id,
      name: dto.name,
      plan: dto.plan,
      slug: dto.slug,
    });
    return updated;
  }

  // Delete (solo OWNER). Enforce path id == header tenantId.
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER')
  async remove(@Headers('x-tenant-id') tenantIdHeader: string, @Param('id') id: string) {
    if (tenantIdHeader !== id) throw new ForbiddenException('Mismatched tenant');
    return this.deleteUC.execute({ tenantId: id, requesterRole: 'OWNER' });
  }
}
