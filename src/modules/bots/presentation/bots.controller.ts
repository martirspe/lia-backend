import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Roles, Role } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { CreateBotUseCase } from '../application/use-cases/create-bot.usecase';
import { UpdateBotUseCase } from '../application/use-cases/update-bot.usecase';
import { DeleteBotUseCase } from '../application/use-cases/delete-bot.usecase';
import { GetBotUseCase } from '../application/use-cases/get-bot.usecase';
import { ListBotsUseCase } from '../application/use-cases/list-bots.usecase';
import { CreateBotDto } from '../application/dto/create-bot.dto';
import { UpdateBotDto } from '../application/dto/update-bot.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

// Controlador para la gestión de bots
@Controller('bots')
@UsePipes(ValidationPipe)
@UseGuards(AuthGuard, RolesGuard)
export class BotsController {
  constructor(
    private readonly createUC: CreateBotUseCase,
    private readonly updateUC: UpdateBotUseCase,
    private readonly deleteUC: DeleteBotUseCase,
    private readonly getUC: GetBotUseCase,
    private readonly listUC: ListBotsUseCase,
  ) { }

  // Endpoint para listar bots
  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() pag: PaginationDto,
    @Query('q') q?: string,
  ) {
    const page = Number(pag.page ?? 1);
    const pageSize = Math.min(Number(pag.pageSize ?? 20), 100);
    return this.listUC.execute({ tenantId, page, pageSize, q });
  }

  // Endpoint para obtener un bot por ID
  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  async get(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.getUC.execute({ tenantId, id });
  }

  // Endpoint para crear un nuevo bot
  @Post()
  @Roles('OWNER', 'ADMIN')
  @HttpCode(201)
  async create(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateBotDto) {
    return this.createUC.execute({
      tenantId,
      name: dto.name,
      plan: dto.plan,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      topP: dto.topP,
      ragEnabled: dto.ragEnabled,
      ragTopK: dto.ragTopK,
      ragSemantic: dto.ragSemantic,
      ragPromptNote: dto.ragPromptNote,
    });
  }

  // Endpoint para actualizar un bot existente
  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBotDto,
  ) {
    return this.updateUC.execute({
      tenantId,
      id,
      name: dto.name,
      plan: dto.plan,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      topP: dto.topP,
      ragEnabled: dto.ragEnabled,
      ragTopK: dto.ragTopK,
      ragSemantic: dto.ragSemantic,
      ragPromptNote: dto.ragPromptNote,
    });
  }

  // Endpoint para eliminar un bot
  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  async remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.deleteUC.execute({ tenantId, id });
  }
}
