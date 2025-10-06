import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

// Caso de uso para el login de usuarios
@Injectable()
export class LoginUseCase {
  constructor(private readonly auth: AuthService) {}
  execute(tenantId: string, email: string, password: string) {
    return this.auth.login(tenantId, email, password);
  }
}