import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Tenant, User } from '@prisma/client';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  getById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async createTenant(params: { name: string; slug: string; plan?: string }): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: { name: params.name, slug: params.slug, plan: params.plan ?? null },
    });
  }

  async createOwnerUser(params: { tenantId: string; email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        tenantId: params.tenantId,
        email: params.email,
        password: params.passwordHash,
        role: 'OWNER',
        name: null,
      },
    });
  }

  async attachStripeCustomer(tenantId: string, stripeCustomerId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId },
    });
  }

  async updateTenant(id: string, data: { name?: string; plan?: string; slug?: string }) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        plan: data.plan ?? null,
        slug: data.slug,
      },
    });
  }

  async deleteTenant(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const u = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return !!u;
  }
}