import { Injectable, NotFoundException } from '@nestjs/common';
import { FilesRepository } from '../../infrastructure/files.repository';

@Injectable()
export class GetFileUseCase {
  constructor(private readonly repo: FilesRepository) {}

  async execute(params: { tenantId: string; id: string }) {
    const f = await this.repo.getById(params.tenantId, params.id);
    if (!f) throw new NotFoundException('File not found');
    return f;
  }
}