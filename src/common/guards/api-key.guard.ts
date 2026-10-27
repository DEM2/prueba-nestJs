import { createHash, timingSafeEqual } from 'node:crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { API_KEY_HEADER } from '../constants/metadata-keys';

/**
 * Guard para integraciones externas.
 * Compara el header x-api-key con la variable de entorno API_KEY.
 * - Sin header        -> 401 "API Key no proporcionada"
 * - Valor incorrecto  -> 401 "API Key inválida"
 *
 * La comparación usa timingSafeEqual sobre hashes de igual longitud para
 * no revelar, por diferencias de tiempo, cuántos caracteres coinciden.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[API_KEY_HEADER];
    const expected = this.configService.get<string>('API_KEY');

    if (!provided || typeof provided !== 'string') {
      throw new UnauthorizedException('API Key no proporcionada (header x-api-key)');
    }
    if (!expected || !this.safeEquals(provided, expected)) {
      throw new UnauthorizedException('API Key inválida');
    }
    return true;
  }

  private safeEquals(a: string, b: string): boolean {
    const hashA = createHash('sha256').update(a).digest();
    const hashB = createHash('sha256').update(b).digest();
    return timingSafeEqual(hashA, hashB);
  }
}