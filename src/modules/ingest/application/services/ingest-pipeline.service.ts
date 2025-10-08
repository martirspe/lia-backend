import { Injectable, Logger } from '@nestjs/common';
import { IngestRepository } from '../../infrastructure/ingest.repository';
import { GenerateEmbeddingUseCase } from '../../../rag/application/use-cases/generate-embedding.usecase';
import { IngestSource, Chunk } from '../../domain/source.entity';

@Injectable()
export class IngestPipelineService {
  private readonly logger = new Logger(IngestPipelineService.name);

  constructor(
    private readonly repo: IngestRepository,
    private readonly generateEmbeddingUC: GenerateEmbeddingUseCase,
  ) {}

  // Enqueue operations (fire-and-forget in-process)
  async enqueueFile(tenantId: string, botId: string, fileId: string, title?: string) {
    const job = await this.repo.createJob(tenantId, { fileId, botId, type: 'file' });
    setImmediate(() => this.processFile(job.id, tenantId, botId, fileId, title).catch(this.logError));
    return job;
  }

  async enqueueUrl(tenantId: string, botId: string, url: string, title?: string) {
    const job = await this.repo.createJob(tenantId, { botId, url, type: 'url' });
    setImmediate(() => this.processUrl(job.id, tenantId, botId, url, title).catch(this.logError));
    return job;
  }

  async enqueueApi(tenantId: string, botId: string, content: string, source?: string, title?: string) {
    const job = await this.repo.createJob(tenantId, { botId, type: 'api', source });
    setImmediate(() => this.processApi(job.id, tenantId, botId, content, source, title).catch(this.logError));
    return job;
  }

  // Processors
  private async processFile(jobId: string, tenantId: string, botId: string, fileId: string, title?: string) {
    await this.repo.updateJobStatus(jobId, 'running');
    const file = await this.repo.getFile(tenantId, fileId);
    if (!file) return this.failJob(jobId, `File not found: ${fileId}`);

    await this.repo.markFileProcessing(file.id);
    const content = await this.loadFileContent(file.storagePath, file.mimeType);
    if (!content?.trim()) return this.failJob(jobId, 'Empty file content');

    const document = await this.repo.createRagDocument(tenantId, botId, title ?? file.originalName, file.mimeType, file.size, 'file');
    const chunks = this.splitIntoChunks(content, document.title, file.originalName);
    await this.indexChunks(tenantId, botId, document.id, chunks);

    await this.repo.markFileReady(file.id);
    await this.repo.updateJobStatus(jobId, 'completed');
  }

  private async processUrl(jobId: string, tenantId: string, botId: string, url: string, title?: string) {
    await this.repo.updateJobStatus(jobId, 'running');
    const content = await this.fetchUrl(url);
    if (!content?.trim()) return this.failJob(jobId, 'Empty URL content');

    const document = await this.repo.createRagDocument(tenantId, botId, title ?? url, 'text/html', content.length, 'url');
    const chunks = this.splitIntoChunks(this.htmlToText(content), document.title, url);
    await this.indexChunks(tenantId, botId, document.id, chunks);

    await this.repo.updateJobStatus(jobId, 'completed');
  }

  private async processApi(jobId: string, tenantId: string, botId: string, content: string, source?: string, title?: string) {
    await this.repo.updateJobStatus(jobId, 'running');
    if (!content?.trim()) return this.failJob(jobId, 'Empty API content');

    const document = await this.repo.createRagDocument(tenantId, botId, title ?? 'API Content', 'text/plain', content.length, source ?? 'api');
    const chunks = this.splitIntoChunks(content, document.title, source ?? 'api');
    await this.indexChunks(tenantId, botId, document.id, chunks);

    await this.repo.updateJobStatus(jobId, 'completed');
  }

  // Helpers
  private async indexChunks(tenantId: string, botId: string, documentId: string, chunks: Chunk[]) {
    for (const c of chunks) {
      // Persist RagChunk (embedding metadata references Qdrant)
      await this.repo.createRagChunk(tenantId, botId, documentId, c.idx, c.content);
      // Generate embedding and upsert to Qdrant
      await this.generateEmbeddingUC.execute({
        tenantId,
        botId,
        fileId: documentId,
        chunkIdx: c.idx,
        content: c.content,
        title: c.title,
        source: c.source,
      });
    }
  }

  private splitIntoChunks(text: string, title?: string, source?: string, maxLen = 1200, overlap = 150): Chunk[] {
    // Simple tokenizer by characters with overlap; adjust to tokens using tiktoken if needed
    const chunks: Chunk[] = [];
    let idx = 0;
    for (let start = 0; start < text.length; start += (maxLen - overlap)) {
      const slice = text.slice(start, Math.min(start + maxLen, text.length)).trim();
      if (slice.length > 0) {
        chunks.push({ idx, content: slice, title, source });
        idx++;
      }
    }
    return chunks;
  }

  private async loadFileContent(storagePath: string, mimeType?: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    try {
      const buf = await fs.readFile(storagePath);
      const ext = path.extname(storagePath).toLowerCase();

      // PDF
      if ((mimeType && mimeType.includes('pdf')) || ext === '.pdf') {
        try {
          const pdfParse = (await import('pdf-parse')).default as any;
          const result = await pdfParse(buf);
          return (result?.text || '').toString();
        } catch (e) {
          this.logger.warn(`pdf-parse failed: ${e}`);
        }
      }

      // DOCX (Office Open XML)
      if (
        (mimeType && mimeType.includes('wordprocessingml')) ||
        ext === '.docx'
      ) {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer: buf });
          return (result?.value || '').toString();
        } catch (e) {
          this.logger.warn(`mammoth extract failed: ${e}`);
        }
      }

      // HTML
      const textUtf8 = buf.toString('utf8');
      if (mimeType?.includes('html') || ext === '.html' || ext === '.htm') {
        return this.htmlToText(textUtf8);
      }

      // Plain text / JSON as text
      if (
        mimeType?.startsWith('text/') ||
        mimeType === 'application/json' ||
        ext === '.txt' ||
        ext === '.md' ||
        ext === '.json'
      ) {
        return textUtf8;
      }

      // Fallback to utf8
      return textUtf8;
    } catch (e) {
      this.logger.error(`loadFileContent error: ${e}`);
      return '';
    }
  }

  private async fetchUrl(url: string): Promise<string> {
    const fetch = (await import('node-fetch')).default as unknown as (input: any, init?: any) => Promise<any>;
    const res = await fetch(url, { headers: { 'User-Agent': 'LiaIngest/1.0' }, timeout: 20000 });
    if (!res.ok) return '';
    return res.text();
  }

  private htmlToText(html: string): string {
    // naive text extraction
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|h\d|li|br)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async failJob(jobId: string, message: string) {
    await this.repo.updateJobStatus(jobId, 'failed', message);
  }

  private logError = (e: any) => this.logger.error(e?.stack || e?.message || e);
}