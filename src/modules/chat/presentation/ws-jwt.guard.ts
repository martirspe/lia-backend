import { CanActivate, Injectable } from '@nestjs/common';
import { JwtService } from '../../auth/infrastructure/jwt.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

// Guard to authenticate WebSocket connections using JWT
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  // Method to check if the connection can be activated
  canActivate(context: any): boolean {
    const client: Socket = context.switchToWs().getClient();
    const auth = client.handshake.auth?.token || client.handshake.headers['authorization'];
    const tenantId = (client.handshake.headers['x-tenant-id'] as string) || client.handshake.auth?.tenantId;

    if (!auth) throw new WsException('Missing token');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (!tenantId) throw new WsException('Missing x-tenant-id');

    try {
      const payload = this.jwt.verify(token);
      if (!payload || payload.tid !== tenantId) throw new WsException('Invalid token/tenant');

      // attach user to socket
      (client.data as any).user = { id: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tid };
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}