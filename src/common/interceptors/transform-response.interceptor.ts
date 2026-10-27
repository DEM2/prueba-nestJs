import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';

/** Formato uniforme de toda respuesta exitosa */
export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T | null;
  timestamp: string;
}

/**
 * Interceptor GLOBAL de respuestas exitosas.
 * Envuelve lo que devuelve cualquier controlador en un formato común.
 * Nest asigna el status (200, 201 o el de @HttpCode) antes de ejecutar
 * los interceptores, así que response.statusCode ya es el valor final.
 * Los errores no pasan por aquí: los maneja AllExceptionsFilter.
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode: response.statusCode,
        data: data ?? null,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}