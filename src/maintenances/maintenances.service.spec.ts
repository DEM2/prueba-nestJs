import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Mechanic, MechanicStatus } from '../mechanics/entities/mechanic.entity';
import { UserRole } from '../users/entities/user.entity';
import { Vehicle, VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { Workshop, WorkshopStatus } from '../workshops/entities/workshop.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity';
import { Maintenance } from './entities/maintenance.entity';
import { MaintenanceStatus, MaintenanceType } from './enums/maintenance.enums';
import { MaintenancesService } from './maintenances.service';

const HOUR = 60 * 60 * 1000;

const admin: AuthenticatedUser = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@test.com',
  role: UserRole.ADMIN,
};

// ---------- Fábricas de datos de prueba ----------
function buildMaintenance(overrides: Partial<Maintenance> = {}): Maintenance {
  return Object.assign(new Maintenance(), {
    id: 'm-1',
    type: MaintenanceType.PREVENTIVE,
    description: 'Cambio de aceite',
    mileage: 1000,
    scheduledStart: new Date(Date.now() - 3 * HOUR),
    scheduledEnd: new Date(Date.now() + HOUR),
    status: MaintenanceStatus.SCHEDULED,
    vehicleId: 'v-1',
    mechanicId: 'mech-1',
    workshopId: 'w-1',
    startedAt: null,
    workPerformed: null,
    finalCost: null,
    completedAt: null,
    finalMileage: null,
    ...overrides,
  });
}

function buildVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return Object.assign(new Vehicle(), {
    id: 'v-1',
    plate: 'ABC123',
    brand: 'Chevrolet',
    model: 'NPR',
    year: 2022,
    mileage: 1000,
    status: VehicleStatus.AVAILABLE,
    ...overrides,
  });
}

describe('MaintenancesService', () => {
  let service: MaintenancesService;

  // Datos que devuelven los mocks (cada prueba puede cambiarlos)
  let maintenance: Maintenance;
  let vehicle: Vehicle;
  let mechanic: Mechanic;
  let workshop: Workshop;
  let overlapping: Maintenance | null;
  let vehicleBusy: boolean;

  // ---------- Mocks: reemplazan la BD y otros servicios ----------
  const maintenancesRepository = { findOne: jest.fn() };
  const mechanicsService = { findByUserId: jest.fn(), findOne: jest.fn() };
  const manager = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    maintenance = buildMaintenance();
    vehicle = buildVehicle();
    mechanic = Object.assign(new Mechanic(), {
      id: 'mech-1',
      name: 'Carlos',
      status: MechanicStatus.ACTIVE,
    });
    workshop = Object.assign(new Workshop(), {
      id: 'w-1',
      name: 'Taller Centro',
      status: WorkshopStatus.ACTIVE,
    });
    overlapping = null;
    vehicleBusy = false;

    maintenancesRepository.findOne.mockImplementation(() =>
      Promise.resolve(maintenance),
    );

    // El EntityManager falso devuelve cada entidad según la clase que se pida
    manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Vehicle) return Promise.resolve(vehicle);
      if (entity === Mechanic) return Promise.resolve(mechanic);
      if (entity === Workshop) return Promise.resolve(workshop);
      if (entity === Maintenance) return Promise.resolve(overlapping);
      return Promise.resolve(null);
    });
    manager.findOneOrFail.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === Vehicle ? vehicle : maintenance),
    );
    manager.exists.mockImplementation(() => Promise.resolve(vehicleBusy));
    manager.create.mockImplementation((_entity: unknown, data: object) => ({
      ...data,
    }));
    manager.save.mockImplementation((entity: { id?: string }) =>
      Promise.resolve({ ...entity, id: entity.id ?? 'new-id' }),
    );

    // La "transacción" solo ejecuta el callback con el manager falso
    dataSource.transaction.mockImplementation(
      (callback: (m: typeof manager) => unknown) => callback(manager),
    );

    service = new MaintenancesService(
      maintenancesRepository as never,
      {} as never,
      mechanicsService as never,
      dataSource as never,
    );
  });

  // =====================================================================
  describe('updateStatus — reglas de cambio de estado', () => {
    it('SCHEDULED -> IN_PROGRESS cambia el vehículo a IN_MAINTENANCE', async () => {
      await service.updateStatus('m-1', { status: MaintenanceStatus.IN_PROGRESS }, admin);

      expect(maintenance.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(maintenance.startedAt).toBeInstanceOf(Date);
      expect(vehicle.status).toBe(VehicleStatus.IN_MAINTENANCE);
    });

    it('IN_PROGRESS -> COMPLETED con datos de cierre deja el vehículo AVAILABLE', async () => {
      maintenance = buildMaintenance({
        status: MaintenanceStatus.IN_PROGRESS,
        startedAt: new Date(Date.now() - 2 * HOUR),
      });
      vehicle = buildVehicle({ status: VehicleStatus.IN_MAINTENANCE });

      await service.updateStatus(
        'm-1',
        {
          status: MaintenanceStatus.COMPLETED,
          workPerformed: 'Cambio de aceite y filtro',
          finalCost: 350000,
          completedAt: new Date(Date.now() - HOUR),
          finalMileage: 1200,
        },
        admin,
      );

      expect(maintenance.status).toBe(MaintenanceStatus.COMPLETED);
      expect(maintenance.finalCost).toBe(350000);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
      expect(vehicle.mileage).toBe(1200);
    });

    it('no permite completar sin la información obligatoria de cierre', async () => {
      maintenance = buildMaintenance({ status: MaintenanceStatus.IN_PROGRESS });

      await expect(
        service.updateStatus('m-1', { status: MaintenanceStatus.COMPLETED }, admin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('un mantenimiento COMPLETED no puede regresar a un estado anterior', async () => {
      maintenance = buildMaintenance({ status: MaintenanceStatus.COMPLETED });

      await expect(
        service.updateStatus('m-1', { status: MaintenanceStatus.IN_PROGRESS }, admin),
      ).rejects.toThrow('COMPLETED no puede regresar');
    });

    it('un mantenimiento CANCELLED no puede pasar a IN_PROGRESS ni a COMPLETED', async () => {
      maintenance = buildMaintenance({ status: MaintenanceStatus.CANCELLED });

      await expect(
        service.updateStatus('m-1', { status: MaintenanceStatus.IN_PROGRESS }, admin),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        service.updateStatus('m-1', { status: MaintenanceStatus.COMPLETED }, admin),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('SCHEDULED no puede pasar directamente a COMPLETED', async () => {
      await expect(
        service.updateStatus('m-1', { status: MaintenanceStatus.COMPLETED }, admin),
      ).rejects.toThrow('Transición inválida');
    });

    it('cancelar un mantenimiento IN_PROGRESS libera el vehículo', async () => {
      maintenance = buildMaintenance({ status: MaintenanceStatus.IN_PROGRESS });
      vehicle = buildVehicle({ status: VehicleStatus.IN_MAINTENANCE });

      await service.updateStatus('m-1', { status: MaintenanceStatus.CANCELLED }, admin);

      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('registra el cambio en la auditoría', async () => {
      await service.updateStatus('m-1', { status: MaintenanceStatus.IN_PROGRESS }, admin);

      expect(manager.create).toHaveBeenCalledWith(
        MaintenanceStatusLog,
        expect.objectContaining({
          fromStatus: MaintenanceStatus.SCHEDULED,
          toStatus: MaintenanceStatus.IN_PROGRESS,
          changedById: 'admin-1',
        }),
      );
    });

    it('un técnico no puede cambiar un mantenimiento que no tiene asignado', async () => {
      const technician: AuthenticatedUser = { ...admin, id: 'tech-2', role: UserRole.TECHNICIAN };
      mechanicsService.findByUserId.mockResolvedValue({ id: 'otro-mecanico' });

      await expect(
        service.updateStatus('m-1', { status: MaintenanceStatus.IN_PROGRESS }, technician),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  describe('create — reglas de negocio', () => {
    const dto: CreateMaintenanceDto = {
      type: MaintenanceType.PREVENTIVE,
      description: 'Cambio de aceite',
      mileage: 1500,
      scheduledStart: new Date('2026-11-03T07:30:00-05:00'),
      scheduledEnd: new Date('2026-11-03T09:00:00-05:00'),
      vehicleId: 'v-1',
      mechanicId: 'mech-1',
      workshopId: 'w-1',
    };

    it('crea el mantenimiento en estado SCHEDULED y actualiza el kilometraje', async () => {
      const result = await service.create(dto, admin);

      expect(manager.create).toHaveBeenCalledWith(
        Maintenance,
        expect.objectContaining({ status: MaintenanceStatus.SCHEDULED }),
      );
      expect(vehicle.mileage).toBe(1500);
      expect(result).toBe(maintenance);
    });

    it('rechaza un vehículo INACTIVE', async () => {
      vehicle = buildVehicle({ status: VehicleStatus.INACTIVE });
      await expect(service.create(dto, admin)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza un vehículo que ya tiene un mantenimiento activo', async () => {
      vehicleBusy = true;
      await expect(service.create(dto, admin)).rejects.toThrow(
        'El vehículo ABC123 ya tiene un mantenimiento activo',
      );
    });

    it('rechaza un mecánico inactivo', async () => {
      mechanic.status = MechanicStatus.INACTIVE;
      await expect(service.create(dto, admin)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza un taller inactivo', async () => {
      workshop.status = WorkshopStatus.INACTIVE;
      await expect(service.create(dto, admin)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza si el mecánico tiene un horario que se cruza', async () => {
      overlapping = buildMaintenance({ id: 'm-2' });
      await expect(service.create(dto, admin)).rejects.toThrow('ya tiene un mantenimiento activo entre');
    });

    it('rechaza un kilometraje menor al actual del vehículo', async () => {
      vehicle = buildVehicle({ mileage: 5000 });
      await expect(service.create(dto, admin)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza si la fecha de fin no es posterior a la de inicio', async () => {
      await expect(
        service.create({ ...dto, scheduledEnd: dto.scheduledStart }, admin),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});