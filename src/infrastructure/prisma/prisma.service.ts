import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Servicio que gestiona la conexión y cierre de Prisma con manejo eficiente de errores.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  // Inicializa la conexión con la base de datos Prisma al iniciar el módulo.
  async onModuleInit() {
    await this.$connect();
  }

  // Cierra la conexión con Prisma al destruir el módulo.
  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Habilita los hooks de apagado para cerrar Prisma correctamente con NestJS.
  async enableShutdownHooks(app: INestApplication) {
    app.enableShutdownHooks();
  }
}
