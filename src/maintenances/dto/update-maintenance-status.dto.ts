import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { MaintenanceStatus } from '../enums/maintenance.enums';

/**
 * Cambio de estado. Los campos de cierre solo son obligatorios
 * cuando status = COMPLETED (lo valida el servicio).
 */
export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.IN_PROGRESS })
  @IsEnum(MaintenanceStatus, {
    message: `status debe ser uno de: ${Object.values(MaintenanceStatus).join(', ')}`,
  })
  status: MaintenanceStatus;

  @ApiPropertyOptional({ example: 'Se cambió aceite 15W40 y filtro de aire' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  workPerformed?: string;

  @ApiPropertyOptional({ example: 350000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalCost?: number;

  @ApiPropertyOptional({ example: '2026-11-03T08:45:00-05:00' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'completedAt debe ser una fecha válida (ISO 8601)' })
  completedAt?: Date;

  @ApiPropertyOptional({ example: 46010 })
  @IsOptional()
  @IsInt()
  @Min(0)
  finalMileage?: number;

  @ApiPropertyOptional({ example: 'Cliente solicitó reprogramar', description: 'Observación para la auditoría' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}