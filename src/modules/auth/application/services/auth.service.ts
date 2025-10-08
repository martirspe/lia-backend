import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaAuthRepository } from '../../infrastructure/prisma-auth.repository';
import { JwtService } from '../../infrastructure/jwt.service';
import { BcryptService } from '../../infrastructure/bcrypt.service';

// Servicio de autenticación
@Injectable()
export class AuthService {
  private readonly refreshTtlSec: number;

  // El constructor inyecta las dependencias necesarias
  constructor(
    private readonly repo: PrismaAuthRepository,
    private readonly jwt: JwtService,
    private readonly bcrypt: BcryptService,
    private readonly config: ConfigService,
  ) {
    // jwt.refreshTtl viene como string tipo "7d" o "15m"
    this.refreshTtlSec = parseTtlToSeconds(this.config.get<string>('jwt.refreshTtl') || '7d');
  }

  // Método para iniciar sesión
  async login(tenantId: string, email: string, password: string) {
    const user = await this.repo.findUserByEmail(tenantId, email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await this.bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.jwt.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
      tid: tenantId,
    });

    const { token: refreshToken } = await this.repo.createRefreshToken(
      tenantId,
      user.id,
      this.refreshTtlSec,
    );

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  // Método para refrescar el token de acceso
  async refresh(tenantId: string, token: string) {
    const rt = await this.repo.findValidRefreshToken(tenantId, token);
    if (!rt) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.repo.findUserById(tenantId, rt.userId);
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.jwt.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
      tid: tenantId,
    });

    return { accessToken };
  }

  // Método para cerrar sesión
  async logout(tenantId: string, userId: string, token: string) {
    await this.repo.revokeRefreshToken(tenantId, userId, token);
    return { success: true };
  }
}

// Helper: convierte "15m", "7d", "3600" a segundos
function parseTtlToSeconds(ttl: string | number): number {
  if (typeof ttl === 'number' && Number.isFinite(ttl)) return ttl;
  const s = String(ttl).trim().toLowerCase();
  const m = s.match(/^(\d+)\s*([smhdw]?)$/);
  if (!m) return 7 * 24 * 3600;
  const value = Number(m[1]);
  const unit = m[2] || 's';
  const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  return value * (map[unit] ?? 1);
}
