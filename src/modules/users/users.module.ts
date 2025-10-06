import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './presentation/users.controller';
import { UsersRepository } from './infrastructure/users.repository';
import { UserProfileService } from './application/services/user-profile.service';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { DeleteUserUseCase } from './application/use-cases/delete-user.usecase';
import { ListUsersUseCase } from './application/use-cases/list-users.usecase';
import { GetUserUseCase } from './application/use-cases/get-user.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';
import { BcryptService } from '../auth/infrastructure/bcrypt.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    UserProfileService,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    ChangePasswordUseCase,
    BcryptService,
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
