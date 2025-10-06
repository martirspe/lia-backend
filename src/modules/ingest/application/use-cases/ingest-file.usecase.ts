import { Injectable } from '@nestjs/common';
import { IngestPipelineService } from '../services/ingest-pipeline.service';

@Injectable()
export class IngestFileUseCase {
  constructor(private readonly pipeline: IngestPipelineService) {}

  async execute(params: { tenantId: string; botId: string; fileId: string; title?: string }) {
    const job = await this.pipeline.enqueueFile(params.tenantId, params.botId, params.fileId, params.title);
    return { jobId: job.id, status: job.status };
  }
}