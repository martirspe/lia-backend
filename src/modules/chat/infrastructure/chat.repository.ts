import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { MessageEntity } from '../domain/message.entity';
import { Conversation, Message } from '@prisma/client';

// Repositorio para manejar conversaciones y mensajes en el chat
@Injectable()
export class ChatRepository {

  // Inyectar el servicio de Prisma para interactuar con la base de datos
  constructor(private readonly prisma: PrismaService) { }

  // Crear una nueva conversación
  async createConversation(tenantId: string, botId: string, userId?: string, title?: string): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: { tenantId, botId, userId, title },
    });
  }

  // Obtener una conversación por su ID y el ID del tenant
  async getConversationById(tenantId: string, conversationId: string): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
  }

  // Obtener una conversación junto con los detalles del bot asociado
  async getConversationWithBot(tenantId: string, conversationId: string) {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { bot: true },
    });
  }

  // Listar conversaciones con paginación
  async addMessage(message: MessageEntity): Promise<Message> {
    return this.prisma.message.create({
      data: {
        tenantId: message.tenantId,
        conversationId: message.conversationId,
        role: message.role as any,
        content: message.content,
        model: message.model,
      },
    });
  }

  // Obtener mensajes de una conversación con un límite opcional
  async getMessages(tenantId: string, conversationId: string, take = 50): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  // Eliminar un mensaje si el solicitante tiene el rol adecuado
  async deleteMessage(tenantId: string, conversationId: string, messageId: string, requesterRole: string, _requesterId?: string) {
    const msg = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId, tenantId },
      include: {
        conversation: true,
      },
    });
    if (!msg) return { deleted: false };

    if (!['OWNER', 'ADMIN'].includes(requesterRole)) {
      throw new ForbiddenException('Not allowed to delete message');
    }

    await this.prisma.message.delete({ where: { id: msg.id } });
    return { deleted: true };
  }
}