import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.usecase';

class ForgotDto {
  @IsEmail()
  email!: string;

  @IsString()
  tenantSlug!: string;
}

class ResetDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@Controller('auth/password')
@UsePipes(ValidationPipe)
export class PasswordResetController {
  constructor(
    private readonly requestUC: RequestPasswordResetUseCase,
    private readonly resetUC: ResetPasswordUseCase,
  ) {}

  @Post('forgot')
  @HttpCode(200)
  async forgot(@Body() dto: ForgotDto) {
    return this.requestUC.execute({ tenantSlug: dto.tenantSlug, email: dto.email });
  }

  @Post('reset')
  @HttpCode(200)
  async reset(@Body() dto: ResetDto) {
    return this.resetUC.execute({ token: dto.token, newPassword: dto.newPassword });
  }
}