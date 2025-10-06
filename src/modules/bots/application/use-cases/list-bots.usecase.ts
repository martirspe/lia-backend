import { Injectable } from '@nestjs/common';
import { BotsRepository } from '../../infrastructure/bots.repository';

// Caso de uso para listar bots con paginación y búsqueda opcional
@Injectable()
export class ListBotsUseCase {

  // Inyección del repositorio de bots
  constructor(private readonly repo: BotsRepository) { }

  // Método para obtener la lista de bots
  async execute(params: { tenantId: string; page: number; pageSize: number; q?: string }) {
    const [items, total] = await Promise.all([
      this.repo.list(params.tenantId, params.page, params.pageSize, params.q),
      this.repo.count(params.tenantId, params.q),
    ]);
    return { items, page: params.page, pageSize: params.pageSize, total };
  }
}