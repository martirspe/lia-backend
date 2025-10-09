import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { addMinutes } from 'date-fns';

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, token: string, ttlMinutes = 15) {
    return this.prisma.passwordResetToken.create({
      data: {
        tenantId,
        userId,
        token,
        expiresAt: addMinutes(new Date(), ttlMinutes),
      },
    });
  }

  findValid(token: string, now = new Date()) {
    return this.prisma.passwordResetToken.findFirst({
      where: { token, used: false, expiresAt: { gt: now } },
      include: { user: true, tenant: true },
    });
  }

  markUsed(id: string) {
    return this.prisma.passwordResetToken.update({ where: { id }, data: { used: true } });
  }

  cleanupExpired(now = new Date()) {
    return this.prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { used: true }] },
    });
  }
}