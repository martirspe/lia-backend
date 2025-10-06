import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BotsRepository } from '../../infrastructure/bots.repository';

// Caso de uso para eliminar un bot
@Injectable()
export class DeleteBotUseCase {

  // Inyección del repositorio de bots
  constructor(private readonly repo: BotsRepository) { }

  // Método para la eliminación del bot
  async execute(params: { tenantId: string; id: string }) {
    const current = await this.repo.getById(params.tenantId, params.id);
    if (!current) throw new NotFoundException('Bot not found');

    const deps = await this.repo.dependencies(params.tenantId, params.id);
    if (deps.conversations > 0 || deps.files > 0 || deps.documents > 0) {
      throw new BadRequestException('Bot has related resources; delete them first');
    }

    await this.repo.delete(params.tenantId, params.id);
    return { deleted: true };
  }
}