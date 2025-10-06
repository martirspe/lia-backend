import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantsRepository } from '../../infrastructure/tenants.repository';

@Injectable()
export class UpdateTenantUseCase {
  constructor(private readonly repo: TenantsRepository) {}

  async execute(params: {
    tenantId: string;
    name?: string;
    plan?: string | null;
    slug?: string;
  }) {
    const current = await this.repo.getById(params.tenantId);
    if (!current) throw new NotFoundException('Tenant not found');

    if (params.slug && params.slug !== current.slug) {
      const exists = await this.repo.findBySlug(params.slug);
      if (exists) throw new ConflictException('Slug already in use');
    }

    const updated = await this.repo.updateTenant(params.tenantId, {
      name: params.name,
      plan: params.plan ?? undefined,
      slug: params.slug,
    });

    return { id: updated.id, name: updated.name, slug: updated.slug, plan: updated.plan };
  }
}