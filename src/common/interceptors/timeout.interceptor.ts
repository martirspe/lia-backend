import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError } from 'rxjs';
  // rxjs/operators import for timeout and catchError
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly defaultMs = 15000) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    // Note: created without DI; default value used. You can bind another value when registering if needed.
    return next.handle().pipe(
      timeout(this.defaultMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException('Request timeout');
        }
        throw err;
      }),
    );
    }
}