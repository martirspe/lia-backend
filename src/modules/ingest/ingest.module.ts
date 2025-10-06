import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IngestController } from './presentation/ingest.controller';
import { IngestPipelineService } from './application/services/ingest-pipeline.service';
import { IngestRepository } from './infrastructure/ingest.repository';
import { IngestFileUseCase } from './application/use-cases/ingest-file.usecase';
import { IngestUrlUseCase } from './application/use-cases/ingest-url.usecase';
import { IngestApiUseCase } from './application/use-cases/ingest-api.usecase';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [AuthModule, RagModule],
  controllers: [IngestController],
  providers: [
    IngestRepository,
    IngestPipelineService,
    IngestFileUseCase,
    IngestUrlUseCase,
    IngestApiUseCase,
  ],
  exports: [IngestPipelineService],
})
export class IngestModule {}
