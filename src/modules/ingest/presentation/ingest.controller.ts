import { Body, Controller, Get, Headers, HttpCode, Param, Post, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { IngestFileDto } from '../application/dto/ingest-file.dto';
import { IngestUrlDto } from '../application/dto/ingest-url.dto';
import { IngestApiDto } from '../application/dto/ingest-api.dto';
import { IngestFileUseCase } from '../application/use-cases/ingest-file.usecase';
import { IngestUrlUseCase } from '../application/use-cases/ingest-url.usecase';
import { IngestApiUseCase } from '../application/use-cases/ingest-api.usecase';
import { IngestRepository } from '../infrastructure/ingest.repository';

@Controller('ingest')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class IngestController {
  constructor(
    private readonly ingestFileUC: IngestFileUseCase,
    private readonly ingestUrlUC: IngestUrlUseCase,
    private readonly ingestApiUC: IngestApiUseCase,
    private readonly repo: IngestRepository,
  ) { }

  @Post('file')
  @HttpCode(202)
  async ingestFile(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: IngestFileDto
  ) {
    return this.ingestFileUC.execute({
      tenantId,
      botId: body.botId,
      fileId: body.fileId,
      title: body.title,
    });
  }

  @Post('url')
  @HttpCode(202)
  async ingestUrl(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: IngestUrlDto
  ) {
    return this.ingestUrlUC.execute({
      tenantId,
      botId: body.botId,
      url: body.url,
      title: body.title,
    });
  }

  @Post('api')
  @HttpCode(202)
  async ingestApi(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: IngestApiDto
  ) {
    return this.ingestApiUC.execute({
      tenantId,
      botId: body.botId,
      content: body.content,
      source: body.source,
      title: body.title,
    });
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    const job = await this.repo.getJob(id);
    return job ?? { error: 'Not found' };
  }
}
