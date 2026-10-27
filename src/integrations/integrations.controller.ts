import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiKeyAuth } from '../common/decorators/api-key-auth.decorator';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations (x-api-key)')
@ApiKeyAuth() // Todo este controlador usa x-api-key en lugar de JWT
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('vehicles/:plate/maintenances')
  @ApiOperation({ summary: 'Vehículo e historial de mantenimientos por placa' })
  getVehicleHistory(@Param('plate') plate: string) {
    return this.integrationsService.getVehicleHistory(plate);
  }
}