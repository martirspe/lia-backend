import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  UsePipes,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { UploadFileDto } from '../application/dto/upload-file.dto';
import { ListFilesDto } from '../application/dto/list-files.dto';
import { UploadFileUseCase } from '../application/use-cases/upload-file.usecase';
import { ListFilesUseCase } from '../application/use-cases/list-files.usecase';
import { GetFileUseCase } from '../application/use-cases/get-file.usecase';
import { DeleteFileUseCase } from '../application/use-cases/delete-file.usecase';
import { TriggerIngestUseCase } from '../application/use-cases/trigger-ingest.usecase';
import { ConfigService } from '@nestjs/config';

@Controller('files')
@UsePipes(ValidationPipe)
@UseGuards(AuthGuard, RolesGuard)
export class FilesController {
  constructor(
    private readonly uploadUC: UploadFileUseCase,
    private readonly listUC: ListFilesUseCase,
    private readonly getUC: GetFileUseCase,
    private readonly deleteUC: DeleteFileUseCase,
    private readonly ingestUC: TriggerIngestUseCase,
    private readonly config: ConfigService,
  ) { }

  @Post('upload')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @HttpCode(201)
  async upload(
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: FastifyRequest,
  ) {
    const part: any = await (req as any).file({ limits: { files: 1 } });
    if (!part) throw new BadRequestException('File not received');

    const allowedCsv =
      (this.config.get<string>('files.allowedExtensions') ??
        '.pdf,.docx,.txt,.md,.pptx,.xlsx').toLowerCase();
    const allowed = allowedCsv.split(',').map((e) => e.trim());
    const ext = (path.extname(part.filename) || '').toLowerCase();
    if (!allowed.includes(ext)) throw new BadRequestException(`Unsupported file type: ${ext}`);

    const buffer: Buffer =
      typeof part.toBuffer === 'function'
        ? await part.toBuffer()
        : await streamToBuffer(part.file);

    // campos del form-data
    const fields = (part.fields || {}) as Record<string, any>;
    const botId = readField(fields, 'botId');
    const ingest = toBool(readField(fields, 'ingest'));

    const created = await this.uploadUC.execute({
      tenantId,
      botId: botId || undefined,
      buffer,
      originalName: part.filename,
      mimeType: part.mimetype,
      size: buffer.length,
      ingest,
    });

    return {
      id: created.id,
      botId: created.botId,
      originalName: created.originalName,
      mimeType: created.mimeType,
      size: created.size,
      status: created.status,
      createdAt: created.createdAt,
    };
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: ListFilesDto,
  ) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);
    return this.listUC.execute({
      tenantId,
      botId: query.botId,
      status: query.status,
      page,
      pageSize,
      q: query.q,
    });
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  async get(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.getUC.execute({ tenantId, id });
  }

  @Get(':id/download')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  async download(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const f = await this.getUC.execute({ tenantId, id });
    res.header('Content-Type', f.mimeType || 'application/octet-stream');
    res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(f.originalName)}"`);
    res.header('X-Content-Type-Options', 'nosniff');
    const stream = fs.createReadStream(f.storagePath);
    return new StreamableFile(stream);
  }

  @Post(':id/ingest')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @HttpCode(202)
  async ingest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('botId') botId?: string,
  ) {
    const f = await this.getUC.execute({ tenantId, id });
    const effectiveBotId = botId || f.botId;
    if (!effectiveBotId) {
      return { error: 'botId required to ingest this file' };
    }
    return this.ingestUC.execute({ tenantId, botId: effectiveBotId, fileId: id });
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  async remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.deleteUC.execute({ tenantId, id });
  }
}

// Helpers
function readField(fields: Record<string, any>, key: string): string | undefined {
  const v = fields?.[key];
  if (v == null) return undefined;
  return typeof v === 'object' && 'value' in v ? (v.value as string) : (v as string);
}
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}
function toBool(v: string | undefined): boolean {
  if (!v) return false;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}
