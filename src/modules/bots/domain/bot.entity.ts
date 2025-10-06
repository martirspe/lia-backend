export class BotEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly plan?: string | null,
    public readonly systemPrompt?: string | null,
    public readonly temperature?: number | null,
    public readonly topP?: number | null,
    public readonly ragEnabled: boolean = false,
    public readonly ragTopK: number = 5,
    public readonly ragSemantic: boolean = true,
    public readonly ragPromptNote?: string | null,
  ) {
    if (!tenantId) throw new Error('tenantId required');
    if (!name?.trim()) throw new Error('name required');
    if (temperature != null && (temperature < 0 || temperature > 2)) {
      throw new Error('temperature must be between 0 and 2');
    }
    if (topP != null && (topP <= 0 || topP > 1)) {
      throw new Error('topP must be (0, 1]');
    }
    if (ragTopK != null && (ragTopK < 1 || ragTopK > 50)) {
      throw new Error('ragTopK must be between 1 and 50');
    }
  }

  // Factory method to create a new BotEntity with default values
  static create(params: {
    tenantId: string;
    name: string;
    plan?: string | null;
    systemPrompt?: string | null;
    temperature?: number | null;
    topP?: number | null;
    ragEnabled?: boolean | null;
    ragTopK?: number | null;
    ragSemantic?: boolean | null;
    ragPromptNote?: string | null;
  }) {
    return new BotEntity(
      '',
      params.tenantId,
      params.name.trim(),
      params.plan ?? null,
      params.systemPrompt ?? null,
      params.temperature ?? 0.7,
      params.topP ?? 1,
      params.ragEnabled ?? false,
      params.ragTopK ?? 5,
      params.ragSemantic ?? true,
      params.ragPromptNote ?? null,
    );
  }
}