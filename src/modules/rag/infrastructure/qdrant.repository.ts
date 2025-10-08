import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorEntity } from '../domain/vector.entity';
import { ConfigService } from '@nestjs/config';
import { v5 as uuidv5, validate as uuidValidate, version as uuidVersion } from 'uuid';

type VectorMode =
  | { kind: 'single'; size: number }
  | { kind: 'named'; name: string; size: number };

@Injectable()
export class QdrantRepository {
  private readonly logger = new Logger(QdrantRepository.name);
  private readonly client: QdrantClient;
  private readonly prefix: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('qdrant.url') || 'http://localhost:6333';
    const apiKey = this.config.get<string>('qdrant.apiKey') || undefined;
    this.prefix = (this.config.get<string>('qdrant.collectionPrefix') || 'lia_').replace(/[^a-zA-Z0-9_-]/g, '');
    this.client = new QdrantClient({ url, apiKey });
  }

  private safeName(s: string) {
    return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  }

  collectionName(tenantId: string, botId: string | null): string {
    const t = this.safeName(tenantId);
    const b = this.safeName(botId ?? 'all');
    return `${this.prefix}${t}_${b}`;
  }

  private async getVectorMode(name: string): Promise<VectorMode | null> {
    try {
      const info = await this.client.getCollection(name);
      const vectors = (info as any)?.config?.params?.vectors;
      if (vectors && typeof (vectors as any).size === 'number') {
        return { kind: 'single', size: Number((vectors as any).size) };
      }
      if (vectors && typeof vectors === 'object') {
        const entries = Object.entries(vectors as Record<string, any>);
        if (entries.length > 0) {
          const [nameKey, params] = entries[0];
          return { kind: 'named', name: String(nameKey), size: Number((params as any)?.size) };
        }
      }
      return null;
    } catch (e: any) {
      if (e?.status === 404) return null;
      throw e;
    }
  }

  async ensureCollection(tenantId: string, botId: string | null, vectorSize: number) {
    const name = this.collectionName(tenantId, botId);
    const mode = await this.getVectorMode(name);
    if (!mode) {
      try {
        await this.client.createCollection(name, { vectors: { size: vectorSize, distance: 'Cosine' } });
        try { await this.client.createPayloadIndex(name, { field_name: 'fileId', field_schema: 'keyword' }); } catch {}
        try { await this.client.createPayloadIndex(name, { field_name: 'chunkIdx', field_schema: 'integer' }); } catch {}
        this.logger.log(`Created Qdrant collection ${name} (size=${vectorSize})`);
      } catch (e) {
        this.logger.error(`ensureCollection create failed: ${stringifyErr(e)}`);
        throw e;
      }
      return;
    }
    if (mode.size !== vectorSize) {
      throw new Error(
        `Qdrant collection "${name}" has size=${mode.size} but embeddings.dim=${vectorSize}. Drop and recreate the collection.`,
      );
    }
  }

  async upsert(tenantId: string, botId: string | null, vectors: VectorEntity[]) {
    if (!vectors?.length) return;
    const name = this.collectionName(tenantId, botId);
    const size = vectors[0].vector?.length ?? 0;
    if (!size) throw new Error('Empty vector size');

    await this.ensureCollection(tenantId, botId, size);
    const mode = (await this.getVectorMode(name))!;

    // Validaciones de vector
    for (const v of vectors) {
      if (!Array.isArray(v.vector) || v.vector.length !== size) {
        throw new Error(`Vector length ${v.vector?.length} does not match collection size ${size}`);
      }
      if (v.vector.some((n) => !Number.isFinite(n))) {
        throw new Error('Vector contains non-finite values');
      }
    }

    // Normaliza IDs a entero o UUID (v4/v5). Para strings no-UUID, usar UUID v5 determinístico.
    const toValidPointId = (id: string | number): string | number => {
      if (typeof id === 'number') return id;
      if (uuidValidate(id) && (uuidVersion(id) === 4 || uuidVersion(id) === 5)) return id;
      return uuidv5(id, uuidv5.URL);
    };

    // Construcción de puntos según modo
    const points =
      mode.kind === 'single'
        ? vectors.map((v) => ({ id: toValidPointId(v.id as any), vector: v.vector, payload: v.payload }))
        : vectors.map((v) => ({ id: toValidPointId(v.id as any), vectors: { [mode.name]: v.vector }, payload: v.payload }));

    try {
      await this.client.upsert(name, { wait: true, points } as any);
    } catch (err: any) {
      this.logger.error(`Qdrant upsert failed in "${name}": ${stringifyErr(err)}`);
      throw err;
    }
  }

  async search(
    tenantId: string,
    botId: string | null,
    query: number[],
    topK: number,
  ): Promise<Array<{ id: string | number; score: number; payload: any }>> {
    const name = this.collectionName(tenantId, botId);
    const mode = await this.getVectorMode(name);
    if (!mode) return [];

    const req =
      mode.kind === 'single'
        ? { vector: query, limit: topK, with_payload: true }
        : { vector: { name: mode.name, vector: query }, limit: topK, with_payload: true };

    const result = await this.client.search(name, req as any);
    return result.map((r) => ({
      id: r.id,
      score: r.score ?? 0,
      payload: r.payload,
    }));
  }
}

function stringifyErr(e: any) {
  try {
    return JSON.stringify(e?.response?.data ?? e?.body ?? e);
  } catch {
    return String(e?.message ?? e);
  }
}