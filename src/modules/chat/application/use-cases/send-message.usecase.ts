import { Injectable } from '@nestjs/common';
import { ChatSessionService } from '../services/chat-session.service';

// Caso de uso para enviar un mensaje en una conversación de chat
@Injectable()
export class SendMessageUseCase {
  constructor(private readonly chat: ChatSessionService) {}
  execute(tenantId: string, conversationId: string, userId: string | undefined, content: string) {
    return this.chat.send(tenantId, conversationId, userId, content);
  }
}