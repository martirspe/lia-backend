import {
  BadRequestException,
  Injectable,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Custom ValidationPipe:
 * - whitelist: elimina propiedades no declaradas en DTOs
 * - forbidNonWhitelisted: lanza error si llegan props extra
 * - transform: convierte tipos (query/params/body) según DTOs
 * - enableImplicitConversion: conversiones implícitas (e.g., string -> number)
 * - error shape consistente y fácil de consumir por front
 */
@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
      forbidUnknownValues: true,
      validateCustomDecorators: true,
      exceptionFactory: (errors: ValidationError[] = []) => {
        const details = flattenValidationErrors(errors);
        return new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          details,
        });
      },
    });
  }
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Array<{ field: string; messages: string[] }> {
  const result: Array<{ field: string; messages: string[] }> = [];

  for (const err of errors) {
    const field = parentPath ? `${parentPath}.${err.property}` : err.property;

    if (err.constraints && Object.keys(err.constraints).length > 0) {
      result.push({
        field,
        messages: Object.values(err.constraints),
      });
    }

    if (err.children && err.children.length > 0) {
      result.push(...flattenValidationErrors(err.children, field));
    }
  }

  return result;
}