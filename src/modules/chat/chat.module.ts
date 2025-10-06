import { Module } from '@nestjs/common';
import { ChatController } from './presentation/chat.controller';
import { ChatGateway } from './infrastructure/chat.gateway';
import { ChatSessionService } from './application/services/chat-session.service';
import { SendMessageUseCase } from './application/use-cases/send-message.usecase';
import { GetMessagesUseCase } from './application/use-cases/get-messages.usecase';
import { DeleteMessageUseCase } from './application/use-cases/delete-message.usecase';
import { ChatRepository } from './infrastructure/chat.repository';
import { JwtService } from '../auth/infrastructure/jwt.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatSessionService,
    SendMessageUseCase,
    GetMessagesUseCase,
    DeleteMessageUseCase,
    ChatRepository,
    JwtService
  ],
  exports: [ChatSessionService],
})
export class ChatModule { }
