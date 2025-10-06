import { Injectable } from '@nestjs/common';
import { ChatSessionService } from '../services/chat-session.service';

// Caso de uso para obtener mensajes de una conversación de chat
@Injectable()
export class GetMessagesUseCase {
  constructor(private readonly chat: ChatSessionService) {}
  execute(tenantId: string, conversationId: string, take = 50) {
    return this.chat.history(tenantId, conversationId, take);
  }
}