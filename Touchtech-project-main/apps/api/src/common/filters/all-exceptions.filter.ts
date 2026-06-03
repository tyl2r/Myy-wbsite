import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import { DomainError } from '../errors/domain.error';

/**
 * Single place that translates every thrown error into a stable JSON shape:
 *   { error: { code, message, details? } }
 * Domain errors carry their own status/code; Prisma known errors are mapped to
 * sensible HTTP codes; everything else degrades to 500 without leaking internals.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse();
    const { status, code, message, details } = this.normalize(exception);

    if (status >= 500) {
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    res.status(status).send({ error: { code, message, details } });
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      const message =
        typeof resp === 'string'
          ? resp
          : ((resp as Record<string, unknown>).message as string) ??
            exception.message;
      return {
        status: exception.getStatus(),
        code: 'HTTP_ERROR',
        message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_VIOLATION',
          message: 'A record with these values already exists',
        };
      }
      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Requested record was not found',
        };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };
  }
}
