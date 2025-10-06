import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { TenantsRepository } from '../../infrastructure/tenants.repository';
import { TenantEntity } from '../../domain/tenant.entity';
import { TenantBillingService } from '../services/tenant-billing.service';
import { BcryptService } from '../../../auth/infrastructure/bcrypt.service';

@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly repo: TenantsRepository,
    private readonly billing: TenantBillingService,
    private readonly bcrypt: BcryptService,
  ) {}

  async execute(params: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerPassword: string;
    plan?: string | null;
  }) {
    // Validación básica dominio
    const entity = TenantEntity.create({ name: params.name, slug: params.slug, plan: params.plan });

    // Reglas de unicidad
    const existsSlug = await this.repo.findBySlug(entity.slug);
    if (existsSlug) throw new ConflictException('Slug already in use');

    const emailTaken = await this.repo.isEmailTaken(params.ownerEmail);
    if (emailTaken) throw new ConflictException('Email already registered');

    // Crear tenant
    const tenant = await this.repo.createTenant({
      name: entity.name,
      slug: entity.slug,
      plan: entity.plan ?? undefined,
    });

    // Crear usuario OWNER
    if (!params.ownerPassword || params.ownerPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const passwordHash = await this.bcrypt.hash(params.ownerPassword);
    const owner = await this.repo.createOwnerUser({
      tenantId: tenant.id,
      email: params.ownerEmail.toLowerCase(),
      passwordHash,
    });

    // Crear customer en Stripe si aplica
    const stripeCustomerId = await this.billing.ensureStripeCustomer({
      tenantId: tenant.id,
      tenantName: tenant.name,
      ownerEmail: owner.email,
    });
    if (stripeCustomerId) {
      await this.repo.attachStripeCustomer(tenant.id, stripeCustomerId);
    }

    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, stripeCustomerId: stripeCustomerId ?? null },
      owner: { id: owner.id, email: owner.email, role: owner.role },
    };
  }
}