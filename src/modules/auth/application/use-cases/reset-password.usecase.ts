import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PasswordResetRepository } from '../../infrastructure/password-reset.repository';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PasswordResetRepository,
  ) {}

  async execute(params: { token: string; newPassword: string }) {
    const rec = await this.repo.findValid(params.token);
    if (!rec) throw new BadRequestException('Invalid or expired token');

    const passwordHash = await bcrypt.hash(params.newPassword, 12);
    await this.prisma.user.update({
      where: { id: rec.userId },
      data: { password: passwordHash },
    });

    await this.repo.markUsed(rec.id);
    // Opcional: revocar refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: rec.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }
}