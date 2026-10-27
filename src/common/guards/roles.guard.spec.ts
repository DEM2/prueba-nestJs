import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../users/entities/user.entity';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/metadata-keys';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RolesGuard } from './roles.guard';

/** Crea un ExecutionContext falso con el usuario indicado en request.user */
function contextWith(user?: Partial<AuthenticatedUser>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let metadata: Record<string, unknown>;
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => metadata[key]),
  };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    metadata = {};
  });

  it('permite el acceso si la ruta no declara roles', () => {
    expect(guard.canActivate(contextWith({ role: UserRole.TECHNICIAN }))).toBe(true);
  });

  it('permite el acceso si el usuario tiene el rol requerido', () => {
    metadata[ROLES_KEY] = [UserRole.ADMIN];
    expect(guard.canActivate(contextWith({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('responde 403 si el usuario no tiene el rol requerido', () => {
    metadata[ROLES_KEY] = [UserRole.ADMIN];
    expect(() => guard.canActivate(contextWith({ role: UserRole.TECHNICIAN }))).toThrow(
      ForbiddenException,
    );
  });

  it('deja pasar las rutas marcadas con @Public()', () => {
    metadata[IS_PUBLIC_KEY] = true;
    metadata[ROLES_KEY] = [UserRole.ADMIN];
    expect(guard.canActivate(contextWith(undefined))).toBe(true);
  });
});