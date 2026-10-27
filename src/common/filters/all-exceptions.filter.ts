import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Filtro GLOBAL de excepciones.
 * Todas las respuestas de error salen con el mismo formato:
 * { success, statusCode, message, path, timestamp }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Por defecto: error interno (500)
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      // Errores de Nest y de nuestros servicios: 400, 401, 403, 404, 409...
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    } else if (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string }).code === '23505'
    ) {
      // 23505 = valor duplicado en un campo único de PostgreSQL -> 409, no 500
      statusCode = HttpStatus.CONFLICT;
      message = 'Ya existe un registro con esos datos únicos';
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}