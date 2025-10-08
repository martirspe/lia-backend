import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

// Servicio para manejar la conexión a Redis
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;
  private url!: string;

  // Inyecta el servicio de configuración
  constructor(private readonly config: ConfigService) {}

  // Método para obtener el cliente de Redis
  getClient(): RedisClientType {
    if (!this.client) throw new Error('Redis client not initialized');
    return this.client;
  }

  // Inicializa la conexión al módulo
  async onModuleInit() {
    this.url = this.config.get<string>('redis.url') || 'redis://127.0.0.1:6379';
    this.client = createClient({ url: this.url });
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err?.message || err}`));
    await this.client.connect();
    this.logger.log(`Connected to Redis at ${this.url}`);
  }

  // Cierra la conexión al destruir el módulo
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
