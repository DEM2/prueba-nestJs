import { Module } from '@nestjs/common';

import { MaintenancesModule } from '../maintenances/maintenances.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [VehiclesModule, MaintenancesModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}