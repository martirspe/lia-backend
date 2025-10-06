import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { IngestJob, File as FileModel, RagDocument } from '@prisma/client';

type IngestType = 'FILE' | 'URL' | 'API';

@Injectable()
export class IngestRepository {
  constructor(private readonly prisma: PrismaService) {}

  createJob(
    tenantId: string,
    data: { type: 'file' | 'url' | 'api'; botId: string; fileId?: string; url?: string; source?: string },
  ) {
    const type: IngestType =
      data.type === 'file' ? 'FILE' : data.type === 'url' ? 'URL' : 'API';

    const base = {
      tenantId,
      botId: data.botId,
      url: data.url ?? null,
      source: data.source ?? null,
      type,
      status: 'pending',
      error: null as string | null,
    };

    // Importante: no enviar fileId si no existe (evita null)
    if (data.fileId) {
      return this.prisma.ingestJob.create({
        data: {
          ...base,
          fileId: data.fileId,
        },
      });
    }

    return this.prisma.ingestJob.create({
      data: base,
    });
  }

  updateJobStatus(
    jobId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    error?: string | null,
  ): Promise<IngestJob> {
    return this.prisma.ingestJob.update({
      where: { id: jobId },
      data: { status, error: error ?? null },
    });
  }

  getJob(jobId: string) {
    return this.prisma.ingestJob.findUnique({ where: { id: jobId } });
  }

  async getFile(tenantId: string, fileId: string): Promise<FileModel | null> {
    return this.prisma.file.findFirst({ where: { id: fileId, tenantId } });
  }

  markFileProcessing(fileId: string) {
    return this.prisma.file.update({ where: { id: fileId }, data: { status: 'processing' } });
  }

  markFileReady(fileId: string) {
    return this.prisma.file.update({ where: { id: fileId }, data: { status: 'ready' } });
  }

  createRagDocument(
    tenantId: string,
    botId: string,
    title: string,
    mimeType?: string | null,
    size?: number | null,
    source?: string | null,
  ): Promise<RagDocument> {
    return this.prisma.ragDocument.create({
      data: {
        tenantId,
        botId,
        title,
        source: source ?? null,
        mimeType: mimeType ?? null,
        size: size ?? null,
        status: 'ready',
      },
    });
  }

  async createRagChunk(
    tenantId: string,
    botId: string,
    documentId: string,
    idx: number,
    content: string,
  ) {
    return this.prisma.ragChunk.create({
      data: {
        tenantId,
        botId,
        documentId,
        idx,
        content,
        embedding: {
          provider: 'qdrant',
          pointId: `${documentId}:${idx}`,
        } as any,
      },
    });
  }
}