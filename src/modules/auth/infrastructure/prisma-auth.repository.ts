import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RefreshToken, User } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

// Repositorio para manejar la autenticación usando Prisma ORM
@Injectable()
export class PrismaAuthRepository {
  constructor(private readonly prisma: PrismaService) { }

  // Buscar un usuario por su email dentro de un tenant específico
  findUserByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { tenantId, email } });
  }

  // Crear un nuevo token de refresco para un usuario
  async createRefreshToken(tenantId: string, userId: string, ttlSeconds: number): Promise<{ token: string; entity: RefreshToken }> {
    const token = randomBytes(48).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const entity = await this.prisma.refreshToken.create({
      data: {
        tenantId,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
    return { token, entity };
  }

  // Revocar un token de refresco específico
  async revokeRefreshToken(tenantId: string, userId: string, token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tenantId, userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Buscar un token de refresco válido (no revocado y no expirado)
  async findValidRefreshToken(tenantId: string, token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return this.prisma.refreshToken.findFirst({
      where: {
        tenantId,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}