export type ChatRole = 'SYSTEM' | 'USER' | 'ASSISTANT';

// Clase que representa un mensaje en una conversación de chat
export class MessageEntity {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly tenantId: string,
    public readonly role: ChatRole,
    public readonly content: string,
    public readonly model?: string,
    public readonly createdAt?: Date,
  ) {}

  // Método estático para crear una nueva instancia de MessageEntity con validaciones
  static create(params: {
    conversationId: string;
    tenantId: string;
    role: ChatRole;
    content: string;
    model?: string;
  }): MessageEntity {
    const { conversationId, tenantId, role, content, model } = params;
    if (!content?.trim()) {
      throw new Error('Message content is required');
    }
    if (!['SYSTEM', 'USER', 'ASSISTANT'].includes(role)) {
      throw new Error('Invalid role');
    }
    return new MessageEntity('', conversationId, tenantId, role, content.trim(), model);
  }
}