import { Injectable } from '@nestjs/common';
import { FilesRepository } from '../../infrastructure/files.repository';

@Injectable()
export class ListFilesUseCase {
  constructor(private readonly repo: FilesRepository) {}

  async execute(params: {
    tenantId: string;
    botId?: string;
    status?: 'stored' | 'processing' | 'ready' | 'error';
    page: number;
    pageSize: number;
    q?: string;
  }) {
    const [items, total] = await Promise.all([
      this.repo.list(params.tenantId, params.page, params.pageSize, params.botId, params.status, params.q),
      this.repo.count(params.tenantId, params.botId, params.status, params.q),
    ]);
    return { items, page: params.page, pageSize: params.pageSize, total };
  }
}