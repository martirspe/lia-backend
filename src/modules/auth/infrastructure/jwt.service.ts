import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tid: string;
};

// Servicio para manejar la creación y verificación de tokens JWT
@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly accessTtl: string | number;

  // El constructor lee la configuración del servicio ConfigService
  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('jwt.secret') || 'change-me-in-prod';
    // configuration.ts expone jwt.accessTtl como string (ej: "15m"); jsonwebtoken lo admite.
    this.accessTtl = (this.config.get<string>('jwt.accessTtl') || '15m') as string;
  }

  // Método para firmar un token de acceso
  signAccess(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.accessTtl, algorithm: 'HS256', });
  }

  // Método para verificar y decodificar un token
  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as JwtPayload;
  }
}