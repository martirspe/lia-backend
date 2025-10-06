import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../presentation/ws-jwt.guard';
import { ChatSessionService } from '../application/services/chat-session.service';

type SendPayload = { conversationId: string; content: string };
type JoinPayload = { conversationId: string };

// WebSocket gateway for chat functionality
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket'],
  namespace: '/ws/chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('ChatGateway');

  // Inyección del servicio de chat
  constructor(private readonly chat: ChatSessionService) { }

  // Manejo de nueva conexión
  handleConnection(client: Socket) {
    const user = client.data?.user;
    this.logger.log(`Client connected ${client.id} tenant=${user?.tenantId} user=${user?.id}`);
  }

  // Manejo de desconexión
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected ${client.id}`);
  }

  // Manejo del evento de unirse a una conversación
  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() data: JoinPayload) {
    this.ensurePayload(data, ['conversationId']);
    const room = this.roomName(this.tenant(client), data.conversationId);
    await client.join(room);
    client.emit('joined', { room, conversationId: data.conversationId });
  }

  // Manejo del evento de enviar un mensaje
  @SubscribeMessage('send_message')
  async onSend(@ConnectedSocket() client: Socket, @MessageBody() data: SendPayload) {
    this.ensurePayload(data, ['conversationId', 'content']);

    const tenantId = this.tenant(client);
    const userId = (client.data as any).user?.id as string | undefined;

    const result = await this.chat.send(tenantId, data.conversationId, userId, data.content);

    const room = this.roomName(tenantId, data.conversationId);

    // Emit user message
    this.server.to(room).emit('new_message', {
      id: result.user.id,
      role: result.user.role,
      content: result.user.content,
      conversationId: result.user.conversationId,
      createdAt: result.user.createdAt,
    });

    // If assistant message exists, emit it as well
    if (result.assistant) {
      this.server.to(room).emit('new_message', {
        id: result.assistant.id,
        role: result.assistant.role,
        content: result.assistant.content,
        conversationId: result.assistant.conversationId,
        createdAt: result.assistant.createdAt,
      });
    }

    return { ok: true };
  }

  // Manejo del evento de historial de mensajes
  @SubscribeMessage('history')
  async onHistory(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; take?: number }) {
    this.ensurePayload(data, ['conversationId']);
    const tenantId = this.tenant(client);
    const items = await this.chat.history(tenantId, data.conversationId, data.take ?? 50);
    return { items };
  }

  // Validación del payload recibido
  private ensurePayload(data: any, required: string[]) {
    for (const key of required) {
      if (!data || typeof data[key] === 'undefined' || data[key] === null) {
        throw new WsException(`Missing field: ${key}`);
      }
    }
  }

  // Generación del nombre de la sala basado en tenantId y conversationId
  private roomName(tenantId: string, conversationId: string) {
    return `tenant:${tenantId}:convo:${conversationId}`;
  }

  // Obtención del tenantId desde el contexto del cliente
  private tenant(client: Socket) {
    const tid = (client.data as any)?.user?.tenantId;
    if (!tid) throw new WsException('Missing tenant in context');
    return tid;
  }
}