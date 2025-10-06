import { Injectable, NotFoundException } from '@nestjs/common';
import { BotsRepository } from '../../infrastructure/bots.repository';

// Caso de uso para obtener un bot por su ID
@Injectable()
export class GetBotUseCase {

  // Inyección del repositorio de bots
  constructor(private readonly repo: BotsRepository) { }

  // Método para obtener el bot
  async execute(params: { tenantId: string; id: string }) {
    const bot = await this.repo.getById(params.tenantId, params.id);
    if (!bot) throw new NotFoundException('Bot not found');
    return bot;
  }
}