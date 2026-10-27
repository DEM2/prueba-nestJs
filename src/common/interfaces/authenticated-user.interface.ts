import type { Request } from 'express';

import type { UserRole } from '../../users/entities/user.entity';

/** Contenido firmado dentro del JWT */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/** Usuario que el JwtAuthGuard deja disponible en request.user */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Request de Express con el usuario autenticado */
export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}