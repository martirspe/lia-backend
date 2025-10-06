import { Injectable } from '@nestjs/common';
import { IngestPipelineService } from '../services/ingest-pipeline.service';

@Injectable()
export class IngestApiUseCase {
  constructor(private readonly pipeline: IngestPipelineService) {}

  async execute(params: { tenantId: string; botId: string; content: string; source?: string; title?: string }) {
    const job = await this.pipeline.enqueueApi(params.tenantId, params.botId, params.content, params.source, params.title);
    return { jobId: job.id, status: job.status };
  }
}