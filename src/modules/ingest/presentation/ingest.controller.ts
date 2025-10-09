import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { IngestFileDto } from '../application/dto/ingest-file.dto';
import { IngestUrlDto } from '../application/dto/ingest-url.dto';
import { IngestApiDto } from '../application/dto/ingest-api.dto';
import { IngestFileUseCase } from '../application/use-cases/ingest-file.usecase';
import { IngestUrlUseCase } from '../application/use-cases/ingest-url.usecase';
import { IngestApiUseCase } from '../application/use-cases/ingest-api.usecase';
import { IngestRepository } from '../infrastructure/ingest.repository';
import { IngestPipelineService } from '../application/services/ingest-pipeline.service';

@Controller('ingest')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class IngestController {
  constructor(
    private readonly ingestFileUC: IngestFileUseCase,
    private readonly ingestUrlUC: IngestUrlUseCase,
    private readonly ingestApiUC: IngestApiUseCase,
    private readonly repo: IngestRepository,
    private readonly pipeline: IngestPipelineService,
  ) { }

  @Post('file')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @HttpCode(202)
  async ingestFile(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: IngestFileDto,
    @Req() req: FastifyRequest,
  ) {
    const ctype = String(req.headers['content-type'] || '').toLowerCase();
    if (!ctype.includes('application/json')) {
      throw new BadRequestException('Content-Type must be application/json');
    }

    const job = await this.pipeline.enqueueFile(tenantId, dto.botId, dto.fileId, dto.title);
    return { accepted: true, jobId: job.id ?? undefined };
  }

  @Post('url')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @HttpCode(202)
  async ingestUrl(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: IngestUrlDto,
    @Req() req: FastifyRequest,
  ) {
    const ctype = String(req.headers['content-type'] || '').toLowerCase();
    if (!ctype.includes('application/json')) {
      throw new BadRequestException('Content-Type must be application/json');
    }
    return this.ingestUrlUC.execute({ tenantId, botId: body.botId, url: body.url, title: body.title });
  }

  @Post('api')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @HttpCode(202)
  async ingestApi(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: IngestApiDto,
    @Req() req: FastifyRequest,
  ) {
    const ctype = String(req.headers['content-type'] || '').toLowerCase();
    if (!ctype.includes('application/json')) {
      throw new BadRequestException('Content-Type must be application/json');
    }
    return this.ingestApiUC.execute({ tenantId, botId: body.botId, content: body.content, source: body.source, title: body.title });
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    const job = await this.repo.getJob(id);
    return job ?? { error: 'Not found' };
  }
}
