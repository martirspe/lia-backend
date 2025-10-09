import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PasswordResetRepository } from '../../infrastructure/password-reset.repository';
import { randomBytes } from 'crypto';

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PasswordResetRepository,
  ) {}

  async execute(params: { tenantSlug?: string; email: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: params.email,
        tenant: params.tenantSlug ? { slug: params.tenantSlug } : undefined,
      },
      include: { tenant: true },
    });
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.repo.create(user.tenantId, user.id, token);
      // TODO: enviar email (cola) con link incluyendo tenant slug
    }
    return { ok: true }; // siempre OK
  }
}