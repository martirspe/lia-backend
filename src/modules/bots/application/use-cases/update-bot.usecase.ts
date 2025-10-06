import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { BotsRepository } from '../../infrastructure/bots.repository';

// Caso de uso para actualizar un bot
@Injectable()
export class UpdateBotUseCase {

  // Inyección del repositorio de bots
  constructor(private readonly repo: BotsRepository) {}

  // Método para la actualización del bot
  async execute(params: {
    tenantId: string;
    id: string;
    name?: string;
    plan?: string | null;
    systemPrompt?: string | null;
    temperature?: number | null;
    topP?: number | null;
    ragEnabled?: boolean | null;
    ragTopK?: number | null;
    ragSemantic?: boolean | null;
    ragPromptNote?: string | null;
  }) {
    const current = await this.repo.getById(params.tenantId, params.id);
    if (!current) throw new NotFoundException('Bot not found');

    if (params.name && params.name !== current.name) {
      const exists = await this.repo.existsByName(params.tenantId, params.name);
      if (exists) throw new ConflictException('Bot name already in use');
    }

    const updated = await this.repo.update(params.tenantId, params.id, params);
    return updated;
  }
}