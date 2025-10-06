import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatRepository } from '../../infrastructure/chat.repository';
import { MessageEntity } from '../../domain/message.entity';
import { AnswerQuestionUseCase } from '../../../rag/application/use-cases/answer-question.usecase';

// Servicio para manejar sesiones de chat
@Injectable()
export class ChatSessionService {

  // Inyección de dependencias del repositorio y caso de uso
  constructor(
    private readonly repo: ChatRepository,
    private readonly answerUC: AnswerQuestionUseCase,
  ) { }

  // Crea una nueva conversación
  async createConversation(tenantId: string, botId: string, userId?: string, title?: string) {
    return this.repo.createConversation(tenantId, botId, userId, title);
  }

  // Envía un mensaje y obtiene una respuesta del asistente
  async send(tenantId: string, conversationId: string, userId: string | undefined, content: string) {
    const convo = await this.repo.getConversationWithBot(tenantId, conversationId);
    if (!convo) throw new NotFoundException('Conversation not found');

    const userMsg = MessageEntity.create({
      conversationId,
      tenantId,
      role: 'USER',
      content,
    });
    const savedUser = await this.repo.addMessage(userMsg);

    // If RAG enabled, generate assistant answer using the bot configuration
    let assistantMsg = null as any;
    if (convo.bot?.ragEnabled) {
      const result = await this.answerUC.execute({
        tenantId,
        bot: {
          id: convo.botId,
          name: convo.bot.name,
          systemPrompt: convo.bot.systemPrompt,
          ragEnabled: convo.bot.ragEnabled,
          ragTopK: convo.bot.ragTopK,
          ragPromptNote: convo.bot.ragPromptNote,
          temperature: convo.bot.temperature,
          topP: convo.bot.topP,
        },
        question: content,
      });

      const assistant = new MessageEntity(
        '',
        conversationId,
        tenantId,
        'ASSISTANT',
        result.answer,
        result.model,
      );
      assistantMsg = await this.repo.addMessage(assistant);
      // Note: tokens/latency could be persisted by extending schema or using AuditLog.metadata
    }

    return { user: savedUser, assistant: assistantMsg };
  }

  // Obtiene el historial de mensajes de una conversación
  async history(tenantId: string, conversationId: string, take = 50) {
    const convo = await this.repo.getConversationById(tenantId, conversationId);
    if (!convo) throw new NotFoundException('Conversation not found');

    return this.repo.getMessages(tenantId, conversationId, take);
  }

  // Elimina un mensaje específico de una conversación
  async delete(tenantId: string, conversationId: string, messageId: string, requesterRole: string, requesterId?: string) {
    return this.repo.deleteMessage(tenantId, conversationId, messageId, requesterRole, requesterId);
  }
}