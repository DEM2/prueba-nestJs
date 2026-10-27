import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../constants/metadata-keys';

/**
 * @Roles(UserRole.ADMIN, ...) declara qué roles pueden ejecutar una ruta.
 * Lo valida el RolesGuard. Puede ir en el controlador o en cada método
 * (el del método tiene prioridad).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);