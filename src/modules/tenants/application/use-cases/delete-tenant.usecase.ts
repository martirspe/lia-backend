import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TenantsRepository } from '../../infrastructure/tenants.repository';

@Injectable()
export class DeleteTenantUseCase {
  constructor(private readonly repo: TenantsRepository) {}

  async execute(params: { tenantId: string; requesterRole: string }) {
    if (params.requesterRole !== 'OWNER') {
      throw new ForbiddenException('Only OWNER can delete a tenant');
    }
    try {
      await this.repo.deleteTenant(params.tenantId);
      return { deleted: true };
    } catch (e: any) {
      throw new BadRequestException('Unable to delete tenant with existing relations');
    }
  }
}