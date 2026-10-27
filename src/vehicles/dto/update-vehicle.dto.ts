import { PartialType } from '@nestjs/swagger';

import { CreateVehicleDto } from './create-vehicle.dto';

/**
 * Todos los campos de creación, pero opcionales.
 * El estado NO se cambia aquí: lo controlan los endpoints de
 * activar/inactivar y el flujo de mantenimientos.
 */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}