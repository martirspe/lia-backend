import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorEntity } from '../domain/vector.entity';

type QdrantPoint = {
  id: string;
  vector: number[];
  payload: any;
};

@Injectable()
export class QdrantRepository {
  private readonly logger = new Logger(QdrantRepository.name);
  private readonly client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY || undefined,
    });
  }

  collectionName(tenantId: string, botId: string | null): string {
    // Keep name short and valid
    const t = tenantId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    const b = (botId ?? 'all').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    return `lia_${t}_${b}`;
  }

  async ensureCollection(tenantId: string, botId: string | null, vectorSize: number) {
    const name = this.collectionName(tenantId, botId);
    try {
      const exists = await this.client.getCollection(name).then(() => true).catch(() => false);
      if (!exists) {
        await this.client.createCollection(name, {
          vectors: { size: vectorSize, distance: 'Cosine' },
        });
        await this.client.createPayloadIndex(name, {
          field_name: 'documentId',
          field_schema: 'keyword',
        });
        await this.client.createPayloadIndex(name, {
          field_name: 'chunkIdx',
          field_schema: 'integer',
        });
      }
    } catch (e) {
      this.logger.error(`ensureCollection failed: ${e}`);
      throw e;
    }
  }

  async upsert(tenantId: string, botId: string | null, vectors: VectorEntity[]) {
    const name = this.collectionName(tenantId, botId);
    const points: QdrantPoint[] = vectors.map((v) => ({
      id: v.id,
      vector: v.vector,
      payload: v.payload,
    }));
    await this.client.upsert(name, { points });
  }

  async search(
    tenantId: string,
    botId: string | null,
    query: number[],
    topK: number,
  ): Promise<Array<{ id: string | number; score: number; payload: any }>> {
    const name = this.collectionName(tenantId, botId);
    const result = await this.client.search(name, {
      vector: query,
      limit: topK,
      with_payload: true,
    });
    return result.map((r) => ({
      id: r.id,
      score: r.score ?? 0,
      payload: r.payload,
    }));
  }
}