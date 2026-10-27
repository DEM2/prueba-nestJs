import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type {
  AuthenticatedUser,
  RequestWithUser,
} from '../interfaces/authenticated-user.interface';

/**
 * @CurrentUser() inyecta el usuario autenticado (request.user) en el handler.
 * @CurrentUser('id') devuelve solo una propiedad.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);