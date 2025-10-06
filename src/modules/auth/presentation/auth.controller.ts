import { Body, Controller, Headers, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';
import { LoginDto } from '../application/dto/login.dto';
import { RefreshDto } from '../application/dto/refresh.dto';

// Controlador de autenticación
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AuthController {
  constructor(
    private readonly loginUC: LoginUseCase,
    private readonly refreshUC: RefreshTokenUseCase,
    private readonly logoutUC: LogoutUseCase,
  ) { }

  // Endpoint para iniciar sesión
  @Post('login')
  @HttpCode(200)
  async login(@Headers('x-tenant-id') tenantId: string, @Body() body: LoginDto) {
    return this.loginUC.execute(tenantId, body.email, body.password);
  }

  // Endpoint para refrescar el token
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Headers('x-tenant-id') tenantId: string, @Body() body: RefreshDto) {
    return this.refreshUC.execute(tenantId, body.refreshToken);
  }

  // Endpoint para cerrar sesión
  @Post('logout')
  @HttpCode(200)
  async logout(@Headers('x-tenant-id') tenantId: string, @Body() body: RefreshDto, @Headers('x-user-id') userId: string) {
    return this.logoutUC.execute(tenantId, userId, body.refreshToken);
  }
}
