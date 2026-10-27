import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../constants/metadata-keys';

/**
 * @Public() marca una ruta como pública: el JwtAuthGuard global la deja pasar
 * sin token. Todo lo que no lleve este decorador queda protegido por defecto.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);