import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { File as FileModel } from '@prisma/client';
import { FileEntity } from '../domain/file.entity';

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: FileEntity): Promise<FileModel> {
    return this.prisma.file.create({
      data: {
        tenantId: entity.tenantId,
        botId: entity.botId,
        filename: entity.filename,
        originalName: entity.originalName,
        mimeType: entity.mimeType,
        size: entity.size,
        storagePath: entity.storagePath,
        status: entity.status,
        error: entity.error ?? null,
      },
    });
  }

  getById(tenantId: string, id: string): Promise<FileModel | null> {
    return this.prisma.file.findFirst({ where: { id, tenantId } });
  }

  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    botId?: string,
    status?: 'stored' | 'processing' | 'ready' | 'error',
    q?: string,
  ) {
    const where: any = { tenantId };
    if (botId) where.botId = botId;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { originalName: { contains: q, mode: 'insensitive' as const } },
        { filename: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    return this.prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        botId: true,
        originalName: true,
        filename: true,
        mimeType: true,
        size: true,
        status: true,
        createdAt: true,
      },
    });
  }

  count(
    tenantId: string,
    botId?: string,
    status?: 'stored' | 'processing' | 'ready' | 'error',
    q?: string,
  ) {
    const where: any = { tenantId };
    if (botId) where.botId = botId;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { originalName: { contains: q, mode: 'insensitive' as const } },
        { filename: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    return this.prisma.file.count({ where });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.file.delete({ where: { id } });
  }
}