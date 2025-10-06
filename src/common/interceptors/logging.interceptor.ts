import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    const req = ctx.getRequest() as any;
    const res = ctx.getResponse() as any;

    const { method } = req;
    const url: string = req?.url;
    const tenantId: string | undefined = req?.headers?.['x-tenant-id'];
    const userId: string | undefined = req?.user?.id || req?.user?.sub;
    const requestId: string | undefined = req?.id || req?.headers?.['x-request-id'];

    const onSuccess = () => {
      const ms = Date.now() - now;
      const status = res?.statusCode ?? res?.raw?.statusCode ?? 200;
      const msg = `${method} ${url} ${status} - ${ms}ms`;
      if (req?.log?.info) {
        req.log.info(
          {
            status,
            durationMs: ms,
            tenantId,
            userId,
            requestId,
          },
          msg,
        );
      } else {
        this.logger.log(`${msg} tenant=${tenantId ?? '-'} user=${userId ?? '-'} reqId=${requestId ?? '-'}`);
      }
    };

    const onError = (err: any) => {
      const ms = Date.now() - now;
      const status = res?.statusCode ?? err?.status ?? 500;
      const msg = `${method} ${url} ${status} - ${ms}ms`;
      if (req?.log?.error) {
        req.log.error({ err, status, durationMs: ms, tenantId, userId, requestId }, 'Request failed');
      } else {
        this.logger.error(`${msg} tenant=${tenantId ?? '-'} user=${userId ?? '-'} reqId=${requestId ?? '-'}`);
      }
      throw err;
    };

    return next.handle().pipe(tap(onSuccess), catchError(onError));
  }
}