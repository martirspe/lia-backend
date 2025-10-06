import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

// Caso de uso para refrescar el token de autenticación
@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly auth: AuthService) {}
  execute(tenantId: string, token: string) {
    return this.auth.refresh(tenantId, token);
  }
}