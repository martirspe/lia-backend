import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIEmbeddingsService {
  private readonly logger = new Logger(OpenAIEmbeddingsService.name);

  private readonly provider: string;
  private readonly model: string;
  private readonly dim: number;

  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('openai.apiKey') || '';
    const baseURL = this.config.get<string>('openai.baseUrl') || 'https://api.openai.com/v1';

    this.provider = this.config.get<string>('rag.embeddings.provider') || 'openai';
    this.model = this.config.get<string>('rag.embeddings.model') || 'text-embedding-3-small';
    const dimCfg = this.config.get<number>('rag.embeddings.dim');
    this.dim = Number.isFinite(dimCfg as number) ? (dimCfg as number) : guessDimFromModel(this.model);

    if (!apiKey) {
      this.logger.warn('OPENAI API key is not set. Embeddings will fail until it is configured.');
    }
    if (this.provider !== 'openai') {
      this.logger.warn(`Embeddings provider is set to "${this.provider}", but OpenAIEmbeddingsService is in use.`);
    }

    this.client = new OpenAI({ apiKey, baseURL });
  }

  dimensions(): number {
    return this.dim;
  }

  async embedText(text: string): Promise<number[]> {
    if (!text || !text.trim()) return [];
    const res = await this.client.embeddings.create({
      input: text,
      model: this.model as any,
    });
    return res.data[0].embedding as unknown as number[];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    const inputs = (texts || []).map((t) => t ?? '');
    if (!inputs.length) return [];
    const res = await this.client.embeddings.create({
      input: inputs,
      model: this.model as any,
    });
    return res.data.map((d) => d.embedding as unknown as number[]);
  }
}

function guessDimFromModel(model: string): number {
  const m = (model || '').toLowerCase();
  if (m.includes('3-large') || m.endsWith('-large')) return 3072;
  // text-embedding-3-small default
  return 1536;
}