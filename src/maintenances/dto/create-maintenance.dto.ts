import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { MaintenanceType } from '../enums/maintenance.enums';

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType, { message: 'type debe ser PREVENTIVE o CORRECTIVE' })
  type: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45500, description: 'Kilometraje actual al registrar' })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: '2026-11-03T07:30:00-05:00', description: 'Inicio programado' })
  @Type(() => Date)
  @IsDate({ message: 'scheduledStart debe ser una fecha válida (ISO 8601)' })
  scheduledStart: Date;

  @ApiProperty({ example: '2026-11-03T09:00:00-05:00', description: 'Fin programado' })
  @Type(() => Date)
  @IsDate({ message: 'scheduledEnd debe ser una fecha válida (ISO 8601)' })
  scheduledEnd: Date;

  @ApiProperty()
  @IsUUID('4', { message: 'vehicleId debe ser un UUID válido' })
  vehicleId: string;

  @ApiProperty()
  @IsUUID('4', { message: 'mechanicId debe ser un UUID válido' })
  mechanicId: string;

  @ApiProperty()
  @IsUUID('4', { message: 'workshopId debe ser un UUID válido' })
  workshopId: string;
}