import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Servicio para manejar el hashing y comparación de contraseñas usando bcrypt
@Injectable()
export class BcryptService {
  async hash(password: string): Promise<string> {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    return bcrypt.hash(password, rounds);
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}