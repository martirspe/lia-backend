import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from '../../infrastructure/storage.service';
import { FilesRepository } from '../../infrastructure/files.repository';
import { FileEntity } from '../../domain/file.entity';
import { TriggerIngestUseCase } from './trigger-ingest.usecase';

@Injectable()
export class UploadFileUseCase {
  constructor(
    private readonly repo: FilesRepository,
    private readonly storage: StorageService,
    private readonly triggerIngest: TriggerIngestUseCase,
  ) {}

  async execute(params: {
    tenantId: string;
    botId?: string;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    ingest?: boolean;
  }) {
    if (!params.buffer?.length) throw new BadRequestException('Empty file');
    const { filename, storagePath } = await this.storage.allocateAndSave({
      tenantId: params.tenantId,
      originalName: params.originalName,
      buffer: params.buffer,
    });

    const entity = FileEntity.create({
      tenantId: params.tenantId,
      botId: params.botId ?? null,
      filename,
      originalName: params.originalName,
      mimeType: params.mimeType,
      size: params.size,
      storagePath,
    });

    const created = await this.repo.create(entity);

    if (params.ingest && created.botId) {
      // fire-and-forget
      this.triggerIngest
        .execute({ tenantId: params.tenantId, botId: created.botId, fileId: created.id })
        .catch(() => void 0);
    }

    return created;
  }
}