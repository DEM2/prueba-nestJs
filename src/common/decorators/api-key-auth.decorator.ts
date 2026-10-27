import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { SWAGGER_API_KEY_AUTH } from '../constants/metadata-keys';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { Public } from './public.decorator';

/**
 * @ApiKeyAuth() para endpoints de integraciones externas. Combina:
 *  - @Public(): el sistema externo no usa JWT, así que se salta el JwtAuthGuard,
 *  - UseGuards(ApiKeyGuard): exige el header x-api-key,
 *  - y lo documenta en Swagger.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    Public(),
    UseGuards(ApiKeyGuard),
    ApiSecurity(SWAGGER_API_KEY_AUTH),
    ApiUnauthorizedResponse({ description: 'API Key ausente o incorrecta' }),
  );