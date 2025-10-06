import { Injectable } from '@nestjs/common';
import { QdrantRepository } from '../../infrastructure/qdrant.repository';
import { OpenAIEmbeddingsService } from '../../infrastructure/openai-embeddings.service';
import { VectorEntity, VectorPayload } from '../../domain/vector.entity';

@Injectable()
export class GenerateEmbeddingUseCase {
  constructor(
    private readonly qdrant: QdrantRepository,
    private readonly embeddings: OpenAIEmbeddingsService,
  ) {}

  async execute(params: {
    tenantId: string;
    botId?: string | null;
    documentId: string;
    chunkIdx: number;
    content: string;
    title?: string | null;
    source?: string | null;
  }) {
    const vector = await this.embeddings.embedText(params.content);
    await this.qdrant.ensureCollection(params.tenantId, params.botId ?? null, this.embeddings.dimensions());
    const payload: VectorPayload = {
      tenantId: params.tenantId,
      botId: params.botId ?? null,
      documentId: params.documentId,
      chunkIdx: params.chunkIdx,
      title: params.title ?? null,
      source: params.source ?? null,
      content: params.content,
    };
    const entity = new VectorEntity(
      `${params.documentId}:${params.chunkIdx}`,
      vector,
      payload,
    );
    await this.qdrant.upsert(params.tenantId, params.botId ?? null, [entity]);
    return { upserted: 1 };
  }
}