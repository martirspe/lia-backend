import { Module } from '@nestjs/common';
import { JwtService } from './infrastructure/jwt.service';
import { BcryptService } from './infrastructure/bcrypt.service';
import { AuthRepository } from './infrastructure/auth.repository';
import { AuthService } from './application/services/auth.service';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { AuthController } from './presentation/auth.controller';
import { PasswordResetRepository } from './infrastructure/password-reset.repository';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.usecase';
import { PasswordResetController } from './presentation/password-reset.controller';

@Module({
  providers: [
    JwtService,
    BcryptService,
    AuthRepository,
    AuthService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    PasswordResetRepository,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
  ],
  controllers: [AuthController, PasswordResetController],
  exports: [JwtService],
})
export class AuthModule {}
