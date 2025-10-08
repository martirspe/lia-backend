import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { formatError } from '../../shared/errors/error.utils';

// Servicio que gestiona la conexión y cierre de Prisma con manejo eficiente de errores.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Inicializa la conexión con la base de datos Prisma al iniciar el módulo.
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión a Prisma establecida.');
    } catch (error) {
      this.logger.error(`Error al conectar Prisma: ${formatError(error)}`);
      throw error;
    }
  }

  // Cierra la conexión con Prisma al destruir el módulo.
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Conexión a Prisma cerrada.');
    } catch (error) {
      this.logger.error(`Error al cerrar Prisma: ${formatError(error)}`);
      throw error;
    }
  }

  // Habilita los hooks de apagado para cerrar Prisma correctamente con NestJS.
  async enableShutdownHooks(app: INestApplication) {
    app.enableShutdownHooks();
  }
}
