import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Bot } from '@prisma/client';
import { BotEntity } from '../domain/bot.entity';

// Repositorio para la entidad Bot
@Injectable()
export class BotsRepository {
  constructor(private readonly prisma: PrismaService) { }

  // Verifica si un bot existe por nombre dentro de un tenant específico
  async existsByName(tenantId: string, name: string): Promise<boolean> {
    const bot = await this.prisma.bot.findFirst({
      where: { tenantId, name: { equals: name, mode: 'insensitive' as const } },
      select: { id: true },
    });
    return !!bot;
  }

  // Obtiene un bot por su ID y tenantId
  getById(tenantId: string, id: string): Promise<Bot | null> {
    return this.prisma.bot.findFirst({ where: { id, tenantId } });
  }

  async list(tenantId: string, page: number, pageSize: number, q?: string) {
    const where = {
      tenantId,
      ...(q
        ? { name: { contains: q, mode: 'insensitive' as const } }
        : {}),
    };
    return this.prisma.bot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        plan: true,
        ragEnabled: true,
        ragTopK: true,
        ragSemantic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Cuenta el número total de bots para un tenant específico, con opción de búsqueda
  count(tenantId: string, q?: string) {
    const where = {
      tenantId,
      ...(q
        ? { name: { contains: q, mode: 'insensitive' as const } }
        : {}),
    };
    return this.prisma.bot.count({ where });
  }

  // Crea un nuevo bot en la base de datos
  async create(entity: BotEntity): Promise<Bot> {
    return this.prisma.bot.create({
      data: {
        tenantId: entity.tenantId,
        name: entity.name,
        plan: entity.plan ?? null,
        systemPrompt: entity.systemPrompt ?? null,
        temperature: entity.temperature ?? 0.7,
        topP: entity.topP ?? 1,
        ragEnabled: entity.ragEnabled,
        ragTopK: entity.ragTopK,
        ragSemantic: entity.ragSemantic,
        ragPromptNote: entity.ragPromptNote ?? null,
      },
    });
  }

  // Actualiza un bot existente con nuevos datos
  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      plan?: string | null;
      systemPrompt?: string | null;
      temperature?: number | null;
      topP?: number | null;
      ragEnabled?: boolean | null;
      ragTopK?: number | null;
      ragSemantic?: boolean | null;
      ragPromptNote?: string | null;
    },
  ): Promise<Bot> {
    return this.prisma.bot.update({
      where: { id },
      data: {
        name: data.name,
        plan: data.plan ?? undefined,
        systemPrompt: data.systemPrompt ?? undefined,
        temperature: data.temperature ?? undefined,
        topP: data.topP ?? undefined,
        ragEnabled: data.ragEnabled ?? undefined,
        ragTopK: data.ragTopK ?? undefined,
        ragSemantic: data.ragSemantic ?? undefined,
        ragPromptNote: data.ragPromptNote ?? undefined,
      },
    });
  }

  // Elimina un bot por su ID
  async delete(tenantId: string, id: string) {
    return this.prisma.bot.delete({ where: { id } });
  }

  // Verifica dependencias antes de eliminar un bot
  async dependencies(tenantId: string, id: string) {
    const [conversations, files, documents] = await Promise.all([
      this.prisma.conversation.count({ where: { tenantId, botId: id } }),
      this.prisma.file.count({ where: { tenantId, botId: id } }),
      this.prisma.ragDocument.count({ where: { tenantId, botId: id } }),
    ]);
    return { conversations, files, documents };
  }
}