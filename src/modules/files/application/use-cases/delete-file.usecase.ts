import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../infrastructure/storage.service';
import { FilesRepository } from '../../infrastructure/files.repository';

@Injectable()
export class DeleteFileUseCase {
  constructor(
    private readonly repo: FilesRepository,
    private readonly storage: StorageService,
  ) {}

  async execute(params: { tenantId: string; id: string }) {
    const f = await this.repo.getById(params.tenantId, params.id);
    if (!f) throw new NotFoundException('File not found');
    if (f.status === 'processing') {
      throw new BadRequestException('File is processing; try later');
    }
    await this.storage.deleteIfExists(f.storagePath);
    await this.repo.delete(params.tenantId, params.id);
    return { deleted: true };
  }
}