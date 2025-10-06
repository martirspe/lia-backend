import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  // Tipado laxo para soportar Express/Fastify sin romper en runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    const requestId = req?.id || req?.headers?.['x-request-id'];
    const tenantId = req?.headers?.['x-tenant-id'];

    const done = () => {
      const ms = Date.now() - start;
      const status =
        res?.statusCode ??
        res?.raw?.statusCode ??
        res?.reply?.statusCode ??
        200;
      const msg = `${req?.method} ${req?.url} ${status} - ${ms}ms`;
      if (req?.log?.info) {
        req.log.info({ requestId, tenantId, status, durationMs: ms }, msg);
      } else {
        // eslint-disable-next-line no-console
        console.log(msg);
      }
    };

    // Enlazar de forma segura a los eventos de finalización
    const raw = res?.raw ?? res;
    const attach = (target: any) => {
      try {
        if (target && typeof target.once === 'function') {
          target.once('finish', done);
          target.once('close', done);
        }
      } catch {
        /* ignore */
      }
    };

    attach(raw);
    if (raw !== res) attach(res);

    next();
  }
}