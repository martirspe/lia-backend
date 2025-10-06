import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

// Caso de uso para cerrar sesión
@Injectable()
export class LogoutUseCase {
  constructor(private readonly auth: AuthService) {}
  execute(tenantId: string, userId: string, token: string) {
    return this.auth.logout(tenantId, userId, token);
  }
}