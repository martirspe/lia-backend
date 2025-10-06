import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import configuration from './config/configuration';

async function bootstrap() {
  const cfg = configuration();

  const fastifyAdapter = new FastifyAdapter({
    trustProxy: true,
    logger: cfg.logging.pretty
      ? {
        level: cfg.logging.level,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
      : { level: cfg.logging.level },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  // Prefijo global de la API
  /* app.setGlobalPrefix('api'); */

  // Plugins @fastify/* (v10+ / v13+) por import dinámico para evitar TS2345
  if (cfg.security.enableHelmet) {
    const helmet = (await import('@fastify/helmet')).default as any;
    await app.register(helmet, {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    } as any);
  }

  const cors = (await import('@fastify/cors')).default as any;
  const corsOrigin = (cfg.security.corsOrigin || '*').trim();
  await app.register(cors, {
    origin:
      corsOrigin === '*'
        ? true
        : corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  } as any);

  const rateLimit = (await import('@fastify/rate-limit')).default as any;
  await app.register(rateLimit, {
    max: cfg.security.rateLimitPerMinute,
    timeWindow: '1 minute',
    keyGenerator: (req: any) => {
      const tenant = req.headers['x-tenant-id'] ?? 'public';
      return `${tenant}:${req.ip}`;
    },
  } as any);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TimeoutInterceptor());

  // Soporte multipart para Fastify (requerido para subir archivos)
  const multipart = (await import('@fastify/multipart')).default as any;
  await app.register(multipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: (cfg.files?.maxSizeMb ?? 20) * 1024 * 1024,
      files: 1,
    },
  } as any);

  // Redis adapter for WebSockets (Socket.IO)
  try {
    const pubClient = createClient({ url: cfg.redis.url });
    const subClient = pubClient.duplicate();
    await pubClient.connect();
    await subClient.connect();

    const ioAdapter = new IoAdapter(app);
    // @ts-ignore - override to attach redis adapter
    ioAdapter['createIOServer'] = function (port: number, options?: any) {
      const server = IoAdapter.prototype.createIOServer.call(this, port, options);
      server.adapter(createAdapter(pubClient, subClient));
      return server;
    };
    app.useWebSocketAdapter(ioAdapter);
    app.getHttpAdapter().getInstance().log?.info?.('Socket.IO Redis adapter enabled');
  } catch (err: any) {
    app.getHttpAdapter().getInstance().log?.warn?.(`Redis adapter disabled: ${err?.message || err}`);
  }

  const port = Number(cfg.app.port || 3000);
  await app.listen(port, '0.0.0.0');
  app.getHttpAdapter().getInstance().log?.info?.(`Lia API listening on ${port}`);
}

bootstrap();