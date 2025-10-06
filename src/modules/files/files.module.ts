import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './presentation/files.controller';
import { FilesRepository } from './infrastructure/files.repository';
import { StorageService } from './infrastructure/storage.service';
import { UploadFileUseCase } from './application/use-cases/upload-file.usecase';
import { ListFilesUseCase } from './application/use-cases/list-files.usecase';
import { GetFileUseCase } from './application/use-cases/get-file.usecase';
import { DeleteFileUseCase } from './application/use-cases/delete-file.usecase';
import { TriggerIngestUseCase } from './application/use-cases/trigger-ingest.usecase';
import { AuthModule } from '../auth/auth.module';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [ConfigModule, IngestModule, AuthModule],
  controllers: [FilesController],
  providers: [
    FilesRepository,
    StorageService,
    UploadFileUseCase,
    ListFilesUseCase,
    GetFileUseCase,
    DeleteFileUseCase,
    TriggerIngestUseCase,
  ],
  exports: [FilesRepository],
})
export class FilesModule {}
