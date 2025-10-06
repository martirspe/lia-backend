import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest() as any;
    const reply = ctx.getResponse() as any;

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const base: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req?.url,
      method: req?.method,
      requestId: req?.id || req?.headers?.['x-request-id'],
      tenantId: req?.headers?.['x-tenant-id'],
    };

    let message = 'Internal server error';
    let details: any = undefined;

    if (isHttp) {
      const resp = (exception as HttpException).getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        message = (resp as any).message || (resp as any).error || message;
        details = (resp as any).message && Array.isArray((resp as any).message) ? (resp as any).message : undefined;
      } else {
        message = (exception as any).message || message;
      }
    } else if (exception && typeof exception === 'object') {
      message = (exception as any).message || message;
    }

    const payload = { ...base, message, ...(details ? { details } : {}) };

    // Prefer Fastify logger if present
    if (req?.log?.error) {
      req.log.error({ err: exception, ...payload }, 'HTTP exception');
    } else {
      this.logger.error(
        `${payload.method} ${payload.path} -> ${payload.statusCode} (${payload.message})`,
        (exception as any)?.stack,
      );
    }

    // Fastify reply
    if (reply?.status && reply?.send) {
      reply.status(status).send(payload);
      return;
    }

    // Express fallback
    if (reply?.status && reply?.json) {
      reply.status(status).json(payload);
    }
  }
}