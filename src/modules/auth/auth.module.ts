import { Module } from '@nestjs/common';
import { JwtService } from './infrastructure/jwt.service';
import { BcryptService } from './infrastructure/bcrypt.service';
import { PrismaAuthRepository } from './infrastructure/prisma-auth.repository';
import { AuthService } from './application/services/auth.service';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { AuthController } from './presentation/auth.controller';

@Module({
  providers: [
    JwtService,
    BcryptService,
    PrismaAuthRepository,
    AuthService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  controllers: [AuthController],
  exports: [JwtService],
})
export class AuthModule {}
