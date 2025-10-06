import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateConversationDto } from '../application/dto/create-conversation.dto';
import { SendMessageDto } from '../application/dto/send-message.dto';
import { GetMessagesDto } from '../application/dto/get-messages.dto';
import { ChatSessionService } from '../application/services/chat-session.service';
import { SendMessageUseCase } from '../application/use-cases/send-message.usecase';
import { GetMessagesUseCase } from '../application/use-cases/get-messages.usecase';

// Controlador para manejar las rutas relacionadas con el chat
@Controller('chat')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class ChatController {
  constructor(
    private readonly chat: ChatSessionService,
    private readonly sendUC: SendMessageUseCase,
    private readonly getUC: GetMessagesUseCase,
  ) { }

  // Crear una nueva conversación
  @Post('conversations')
  @HttpCode(201)
  async createConversation(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    const convo = await this.chat.createConversation(tenantId, dto.botId, user?.id, dto.title);
    return { conversationId: convo.id, createdAt: convo.createdAt };
  }

  // Enviar un mensaje en una conversación existente
  @Post('messages')
  @HttpCode(201)
  async sendMessage(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.chat.send(tenantId, dto.conversationId, user?.id, dto.content);
    return {
      user: {
        id: result.user.id,
        role: result.user.role,
        content: result.user.content,
        createdAt: result.user.createdAt,
      },
      assistant: result.assistant
        ? {
          id: result.assistant.id,
          role: result.assistant.role,
          content: result.assistant.content,
          createdAt: result.assistant.createdAt,
        }
        : null,
    };
  }

  // Obtener mensajes de una conversación específica
  @Get('messages')
  async getMessages(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: GetMessagesDto,
  ) {
    const messages = await this.getUC.execute(tenantId, query.conversationId, query.take ?? 50);
    return { items: messages };
  }

  // Obtener detalles de una conversación específica
  @Get('conversations/:id')
  async getConversation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    // Minimal lookup
    const messages = await this.getUC.execute(tenantId, id, 50);
    return { id, messages };
  }
}
