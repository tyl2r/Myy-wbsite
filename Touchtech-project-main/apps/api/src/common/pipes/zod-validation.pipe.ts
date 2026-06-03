import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/domain.error';

/**
 * Validates and parses input against a Zod schema. Bind per-route via
 * `new ZodValidationPipe(schema)` so each endpoint declares its own contract,
 * and the parsed (typed) value flows into the handler.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _meta: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ValidationError('Request validation failed', {
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    return result.data;
  }
}
