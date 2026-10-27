import { Injectable } from '@nestjs/common';

import { MaintenancesService } from '../maintenances/maintenances.service';
import { VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

/**
 * Arma la respuesta para sistemas externos: datos básicos del vehículo
 * y su historial de mantenimientos completados.
 * Se devuelve un formato propio (no las entidades completas) para no
 * exponer campos internos.
 */
@Injectable()
export class IntegrationsService {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly maintenancesService: MaintenancesService,
  ) {}

  async getVehicleHistory(plate: string) {
    const vehicle = await this.vehiclesService.findOne(plate); // 404 si no existe
    const history = await this.maintenancesService.findVehicleHistory(vehicle.id);

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: history.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.description,
        mileage: m.finalMileage ?? m.mileage,
        cost: m.finalCost,
        finishedAt: m.completedAt,
        mechanic: { id: m.mechanic.id, name: m.mechanic.name },
        workshop: { id: m.workshop.id, name: m.workshop.name },
      })),
    };
  }
}