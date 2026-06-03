import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps successful responses in a consistent envelope: { data, meta }.
 * Errors are shaped separately by AllExceptionsFilter. BigInt values are
 * serialized to strings to keep JSON output lossless and valid.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'data' in payload) {
          return serializeBigInt(payload);
        }
        return serializeBigInt({ data: payload, meta: null });
      }),
    );
  }
}

function serializeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    ),
  );
}
