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
import { CreateUserUseCase } from '../application/use-cases/create-user.usecase';
import { UpdateUserUseCase } from '../application/use-cases/update-user.usecase';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.usecase';
import { ListUsersUseCase } from '../application/use-cases/list-users.usecase';
import { GetUserUseCase } from '../application/use-cases/get-user.usecase';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.usecase';
import { CreateUserDto } from '../application/dto/create-user.dto';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { ChangePasswordDto } from '../application/dto/change-password.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@Controller('users')
@UsePipes(ValidationPipe)
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly createUC: CreateUserUseCase,
    private readonly updateUC: UpdateUserUseCase,
    private readonly deleteUC: DeleteUserUseCase,
    private readonly listUC: ListUsersUseCase,
    private readonly getUC: GetUserUseCase,
    private readonly changePwdUC: ChangePasswordUseCase,
  ) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() pag: PaginationDto,
    @Query('q') q?: string,
  ) {
    const page = Number(pag.page ?? 1);
    const pageSize = Math.min(Number(pag.pageSize ?? 20), 100);
    return this.listUC.execute({ tenantId, page, pageSize, q });
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  async get(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.getUC.execute({ tenantId, id });
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @HttpCode(201)
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() requester: any,
    @Body() dto: CreateUserDto,
  ) {
    return this.createUC.execute({
      tenantId,
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: dto.role,
      requesterRole: requester.role as Role,
    });
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() requester: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUC.execute({
      tenantId,
      targetUserId: id,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      requesterId: requester.id,
      requesterRole: requester.role as Role,
    });
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  async remove(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() requester: any,
    @Param('id') id: string,
  ) {
    return this.deleteUC.execute({
      tenantId,
      targetUserId: id,
      requesterId: requester.id,
      requesterRole: requester.role as Role,
    });
  }

  @Post(':id/password')
  @HttpCode(200)
  async changePassword(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() requester: any,
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.changePwdUC.execute({
      tenantId,
      targetUserId: id,
      requesterId: requester.id,
      requesterRole: requester.role as Role,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });
  }
}
