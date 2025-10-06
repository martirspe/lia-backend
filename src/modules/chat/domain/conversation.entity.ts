export class ConversationEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly botId: string,
    public readonly userId?: string,
    public readonly title?: string,
    public readonly status: 'open' | 'closed' = 'open',
  ) { }

  // Método estático para crear una nueva conversación abierta
  static open(params: { tenantId: string; botId: string; userId?: string; title?: string }) {
    return new ConversationEntity('', params.tenantId, params.botId, params.userId, params.title, 'open');
  }
}