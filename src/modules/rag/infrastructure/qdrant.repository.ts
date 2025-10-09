import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorEntity } from '../domain/vector.entity';
import { ConfigService } from '@nestjs/config';
import { v5 as uuidv5, validate as uuidValidate, version as uuidVersion } from 'uuid';

type VectorMode =
  | { kind: 'single'; size: number }
  | { kind: 'named'; name: string; size: number };

type VectorPoint = {
  id: string | number;
  vector: number[];
  payload: Record<string, any>;
};

@Injectable()
export class QdrantRepository {
  private readonly logger = new Logger(QdrantRepository.name);
  private readonly client: QdrantClient;
  private readonly prefix: string;

  constructor(private readonly config: ConfigService) {
    this.client = new QdrantClient({
      url: this.config.get<string>('qdrant.url') || 'http://localhost:6333',
      apiKey: this.config.get<string>('qdrant.apiKey') || undefined,
    });
    this.prefix = (this.config.get<string>('qdrant.collectionPrefix') || 'lia_').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  private safeName(s: string) {
    return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  }

  private collectionName(tenantId: string, botId: string | null) {
    return `${this.prefix}${this.safeName(tenantId)}_${this.safeName(botId ?? 'all')}`;
  }

  private async getVectorMode(name: string): Promise<VectorMode | null> {
    try {
      const info = await this.client.getCollection(name);
      const vectors = (info as any)?.config?.params?.vectors;
      if (vectors && typeof vectors.size === 'number') {
        return { kind: 'single', size: Number(vectors.size) };
      }
      if (vectors && typeof vectors === 'object') {
        const entries = Object.entries(vectors as Record<string, any>);
        if (entries.length > 0) {
          const [key, params] = entries[0];
          return { kind: 'named', name: String(key), size: Number((params as any)?.size) };
        }
      }
      return null;
    } catch (e: any) {
      if (e?.status === 404) return null;
      throw e;
    }
  }

  async ensureCollection(tenantId: string, botId: string | null, size: number) {
    const name = this.collectionName(tenantId, botId);
    const mode = await this.getVectorMode(name);
    if (!mode) {
      await this.client.createCollection(name, { vectors: { size, distance: 'Cosine' } });
      try { await this.client.createPayloadIndex(name, { field_name: 'fileId', field_schema: 'keyword' }); } catch { }
      try { await this.client.createPayloadIndex(name, { field_name: 'chunkIdx', field_schema: 'integer' }); } catch { }
      this.logger.log(`Created Qdrant collection ${name} (size=${size})`);
      return;
    }
    if (mode.size !== size) {
      throw new Error(`Qdrant collection "${name}" has size=${mode.size} but embeddings.dim=${size}. Drop and recreate.`);
    }
  }

  private toValidPointId(id: string | number): string | number {
    if (typeof id === 'number') {
      if (Number.isInteger(id) && id >= 0) return id;
      throw new Error(`Invalid numeric point id: ${id}`);
    }
    if (uuidValidate(id) && (uuidVersion(id) === 4 || uuidVersion(id) === 5)) return id;
    return uuidv5(id, uuidv5.URL);
  }

  async upsert(tenantId: string, botId: string | null, points: VectorPoint[]) {
    if (!points?.length) return;
    const size = points[0].vector.length;
    if (!size) throw new Error('Empty vector size');

    await this.ensureCollection(tenantId, botId, size);
    const name = this.collectionName(tenantId, botId);
    const mode = (await this.getVectorMode(name))!;

    // Validaciones
    for (const p of points) {
      if (!Array.isArray(p.vector) || p.vector.length !== size) {
        throw new Error(`Vector length ${p.vector?.length} does not match collection size ${size}`);
      }
      if (p.vector.some((v) => !Number.isFinite(v))) throw new Error('Vector contains non-finite values');
    }

    // Construcción de puntos
    const payload =
      mode.kind === 'single'
        ? points.map((p) => ({ id: this.toValidPointId(p.id), vector: p.vector, payload: p.payload }))
        : points.map((p) => ({ id: this.toValidPointId(p.id), vectors: { [mode.name]: p.vector }, payload: p.payload }));

    try {
      await this.client.upsert(name, { wait: true, points: payload } as any);
    } catch (err: any) {
      this.logger.error(`Qdrant upsert failed in "${name}": ${stringifyErr(err)}`);
      throw err;
    }
  }

  async deleteByFileId(tenantId: string, botId: string | null, fileId: string) {
    const name = this.collectionName(tenantId, botId);
    try {
      await this.client.delete(name, {
        wait: true,
        filter: { must: [{ key: 'fileId', match: { value: fileId } }] },
      } as any);
    } catch (e) {
      this.logger.error(`Qdrant deleteByFileId failed: ${stringifyErr(e)}`);
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