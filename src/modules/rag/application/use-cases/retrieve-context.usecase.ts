import { Injectable } from '@nestjs/common';
import { QdrantRepository } from '../../infrastructure/qdrant.repository';
import { OpenAIEmbeddingsService } from '../../infrastructure/openai-embeddings.service';

@Injectable()
export class RetrieveContextUseCase {
  constructor(
    private readonly qdrant: QdrantRepository,
    private readonly embeddings: OpenAIEmbeddingsService,
  ) {}

  async execute(params: {
    tenantId: string;
    botId?: string | null;
    query: string;
    topK?: number;
  }) {
    const vector = await this.embeddings.embedText(params.query);
    await this.qdrant.ensureCollection(params.tenantId, params.botId ?? null, this.embeddings.dimensions());
    const results = await this.qdrant.search(
      params.tenantId,
      params.botId ?? null,
      vector,
      params.topK ?? 5,
    );
    return {
      items: results.map((r) => ({
        score: r.score,
        content: r.payload.content,
        title: r.payload.title,
        source: r.payload.source,
        documentId: r.payload.documentId,
        chunkIdx: r.payload.chunkIdx,
      })),
    };
  }
}