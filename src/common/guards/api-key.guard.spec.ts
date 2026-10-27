import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiKeyGuard } from './api-key.guard';

function contextWithHeaders(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  const config = { get: jest.fn(() => 'clave-secreta') };
  const guard = new ApiKeyGuard(config as unknown as ConfigService);

  it('responde 401 si no se envía el header x-api-key', () => {
    expect(() => guard.canActivate(contextWithHeaders({}))).toThrow(UnauthorizedException);
  });

  it('responde 401 si la API Key es incorrecta', () => {
    expect(() =>
      guard.canActivate(contextWithHeaders({ 'x-api-key': 'otra-clave' })),
    ).toThrow('API Key inválida');
  });

  it('permite el acceso con la API Key correcta', () => {
    expect(guard.canActivate(contextWithHeaders({ 'x-api-key': 'clave-secreta' }))).toBe(true);
  });
});