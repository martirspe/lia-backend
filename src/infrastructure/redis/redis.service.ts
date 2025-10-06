import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

// Servicio para manejar la conexión a Redis
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  // Método para obtener el cliente de Redis
  getClient(): RedisClientType {
    return this.client;
  }

  // Inicializa la conexión al módulo
  async onModuleInit() {
    this.client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.client.on('error', (err) => console.error('Redis error', err));
    await this.client.connect();
  }

  // Cierra la conexión al destruir el módulo
  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }
}
