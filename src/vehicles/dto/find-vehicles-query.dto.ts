import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { VehicleStatus } from '../entities/vehicle.entity';

/** Filtros opcionales para GET /vehicles?status=AVAILABLE */
export class FindVehiclesQueryDto {
  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus, {
    message: `status debe ser uno de: ${Object.values(VehicleStatus).join(', ')}`,
  })
  status?: VehicleStatus;
}