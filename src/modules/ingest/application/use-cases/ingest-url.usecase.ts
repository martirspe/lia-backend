import { Injectable } from '@nestjs/common';
import { IngestPipelineService } from '../services/ingest-pipeline.service';

@Injectable()
export class IngestUrlUseCase {
  constructor(private readonly pipeline: IngestPipelineService) {}

  async execute(params: { tenantId: string; botId: string; url: string; title?: string }) {
    const job = await this.pipeline.enqueueUrl(params.tenantId, params.botId, params.url, params.title);
    return { jobId: job.id, status: job.status };
  }
}