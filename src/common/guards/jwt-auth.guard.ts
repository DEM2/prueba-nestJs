import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../constants/metadata-keys';
import type {
  JwtPayload,
  RequestWithUser,
} from '../interfaces/authenticated-user.interface';

/**
 * Guard GLOBAL de autenticación (registrado con APP_GUARD en AuthModule).
 *
 * 1. Si la ruta tiene @Public() la deja pasar.
 * 2. Exige el header "Authorization: Bearer <token>"   -> si no, 401.
 * 3. Verifica firma y expiración del JWT               -> si falla, 401.
 * 4. Comprueba que el usuario siga existiendo y activo -> si no, 401.
 * 5. Deja el usuario en request.user para @CurrentUser() y RolesGuard.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de autenticación no proporcionado');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      const isExpired =
        error instanceof Error && error.name === 'TokenExpiredError';
      throw new UnauthorizedException(
        isExpired ? 'El token ha expirado' : 'Token inválido',
      );
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('El usuario del token no está activo');
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return true;
  }

  private extractBearerToken(request: RequestWithUser): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }
}