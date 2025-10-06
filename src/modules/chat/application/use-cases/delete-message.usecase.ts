import { Injectable } from '@nestjs/common';
import { ChatSessionService } from '../services/chat-session.service';

// Caso de uso para eliminar un mensaje en una conversación de chat
@Injectable()
export class DeleteMessageUseCase {
  constructor(private readonly chat: ChatSessionService) {}
  execute(tenantId: string, conversationId: string, messageId: string, role: string, requesterId?: string) {
    return this.chat.delete(tenantId, conversationId, messageId, role, requesterId);
  }
}