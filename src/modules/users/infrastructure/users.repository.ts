import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { User } from '@prisma/client';
import { UserEntity } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  getById(tenantId: string, id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, tenantId } });
  }

  getByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async list(tenantId: string, page: number, pageSize: number, q?: string) {
    const where = {
      tenantId,
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const items = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return items;
  }

  count(tenantId: string, q?: string) {
    const where = {
      tenantId,
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    return this.prisma.user.count({ where });
  }

  async create(entity: UserEntity): Promise<User> {
    return this.prisma.user.create({
      data: {
        tenantId: entity.tenantId,
        email: entity.email,
        password: entity.passwordHash,
        role: entity.role,
        name: entity.name ?? null,
      },
    });
  }

  async update(tenantId: string, id: string, data: { email?: string; name?: string; role?: 'OWNER' | 'ADMIN' | 'MEMBER' }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email?.toLowerCase(),
        name: data.name,
        role: data.role,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async updatePassword(tenantId: string, id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  async isLastOwner(tenantId: string, userId: string) {
    const owners = await this.prisma.user.count({ where: { tenantId, role: 'OWNER' } });
    if (owners <= 1) {
      const isOwner = await this.prisma.user.findFirst({ where: { id: userId, tenantId, role: 'OWNER' } });
      return !!isOwner;
    }
    return false;
  }
}