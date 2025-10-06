import { Injectable, ConflictException } from '@nestjs/common';
import { BotsRepository } from '../../infrastructure/bots.repository';
import { BotEntity } from '../../domain/bot.entity';

// Caso de uso para crear un nuevo bot
@Injectable()
export class CreateBotUseCase {

  // Inyección del repositorio de bots
  constructor(private readonly repo: BotsRepository) { }

  // Método para la creación del bot
  async execute(params: {
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
    const exists = await this.repo.existsByName(params.tenantId, params.name);
    if (exists) throw new ConflictException('Bot name already in use');

    const entity = BotEntity.create(params);
    const created = await this.repo.create(entity);
    return created;
  }
}