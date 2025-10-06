import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RetrieveContextUseCase } from './application/use-cases/retrieve-context.usecase';
import { GenerateEmbeddingUseCase } from './application/use-cases/generate-embedding.usecase';
import { AnswerQuestionUseCase } from './application/use-cases/answer-question.usecase';
import { ContextBuilderService } from './application/services/context-builder.service';
import { QdrantRepository } from './infrastructure/qdrant.repository';
import { OpenAIEmbeddingsService } from './infrastructure/openai-embeddings.service';
import { OpenAIChatService } from './infrastructure/openai-chat.service';
import { RagController } from './presentation/rag.controller';

@Module({
  imports: [AuthModule],
  controllers: [RagController],
  providers: [
    // Infrastructure
    QdrantRepository,
    OpenAIEmbeddingsService,
    OpenAIChatService,
    // Application services
    ContextBuilderService,
    // Use cases
    RetrieveContextUseCase,
    GenerateEmbeddingUseCase,
    AnswerQuestionUseCase,
  ],
  exports: [
    RetrieveContextUseCase,
    AnswerQuestionUseCase,
    GenerateEmbeddingUseCase,
  ],
})
export class RagModule {}
