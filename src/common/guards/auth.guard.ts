import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../../modules/auth/infrastructure/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    if (!tenantId) throw new UnauthorizedException('Missing x-tenant-id');

    const token = auth.slice('Bearer '.length);
    const payload = this.jwt.verify(token);
    if (!payload || payload.tid !== tenantId) throw new UnauthorizedException('Invalid token');

    req.user = { id: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tid };
    return true;
  }
}