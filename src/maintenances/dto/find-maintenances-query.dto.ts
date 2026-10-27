import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { MaintenanceStatus } from '../enums/maintenance.enums';

export class FindMaintenancesQueryDto {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
}