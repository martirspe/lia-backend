import { Injectable, BadRequestException } from '@nestjs/common';
import { IngestPipelineService } from '../../../ingest/application/services/ingest-pipeline.service';
import { FilesRepository } from '../../infrastructure/files.repository';

@Injectable()
export class TriggerIngestUseCase {
  constructor(
    private readonly pipeline: IngestPipelineService,
    private readonly repo: FilesRepository,
  ) {}

  async execute(params: { tenantId: string; botId: string; fileId: string }) {
    const file = await this.repo.getById(params.tenantId, params.fileId);
    if (!file) throw new BadRequestException('File not found');
    const job = await this.pipeline.enqueueFile(params.tenantId, params.botId, params.fileId, file.originalName);
    return { jobId: job.id, status: job.status };
  }
}