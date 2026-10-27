import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../users/entities/user.entity';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/metadata-keys';
import type { RequestWithUser } from '../interfaces/authenticated-user.interface';

/**
 * Guard GLOBAL de autorización. Se ejecuta DESPUÉS del JwtAuthGuard.
 *
 * Lee los roles declarados con @Roles() y los compara con el rol del usuario.
 * - Si la ruta no declara roles, basta con estar autenticado.
 * - Si el rol no coincide responde 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      targets,
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `No tienes permisos para esta operación. Roles permitidos: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}