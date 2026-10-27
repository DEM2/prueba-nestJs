import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsRelations,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';

import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Mechanic, MechanicStatus } from '../mechanics/entities/mechanic.entity';
import { MechanicsService } from '../mechanics/mechanics.service';
import { UserRole } from '../users/entities/user.entity';
import { Vehicle, VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { Workshop, WorkshopStatus } from '../workshops/entities/workshop.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { FindMaintenancesQueryDto } from './dto/find-maintenances-query.dto';
import { Maintenance } from './entities/maintenance.entity';
import {
  ACTIVE_MAINTENANCE_STATUSES,
  MaintenanceStatus,
} from './enums/maintenance.enums';

/** Relaciones que se devuelven junto a cada mantenimiento */
const FULL_RELATIONS: FindOptionsRelations<Maintenance> = {
  vehicle: true,
  mechanic: true,
  workshop: true,
};

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenancesRepository: Repository<Maintenance>,
    private readonly mechanicsService: MechanicsService,
    private readonly dataSource: DataSource,
  ) {}

  // =====================================================================
  // CREAR
  // =====================================================================

  /**
   * Crea un mantenimiento validando TODAS las reglas de negocio.
   *
   * TRANSACCIÓN: todas las validaciones y el guardado ocurren dentro de una
   * sola transacción. Si algo falla, no se guarda nada.
   * Además se BLOQUEAN (pessimistic_write) las filas del vehículo y del
   * mecánico: si llegan dos peticiones al mismo tiempo para el mismo vehículo
   * o mecánico, la segunda espera a que termine la primera y entonces ya ve
   * el mantenimiento creado. Así se evitan duplicados por concurrencia.
   */
  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    if (dto.scheduledEnd <= dto.scheduledStart) {
      throw new BadRequestException(
        'scheduledEnd debe ser posterior a scheduledStart',
      );
    }

    const maintenanceId = await this.dataSource.transaction(async (manager) => {
      // --- Vehículo: existe, no está inactivo, kilometraje válido ---
      const vehicle = await manager.findOne(Vehicle, {
        where: { id: dto.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) {
        throw new NotFoundException(`No existe un vehículo con id ${dto.vehicleId}`);
      }
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new ConflictException(
          `El vehículo ${vehicle.plate} está INACTIVE y no puede recibir mantenimientos`,
        );
      }
      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException(
          `El kilometraje (${dto.mileage}) no puede ser menor al actual del vehículo (${vehicle.mileage})`,
        );
      }

      // --- Mecánico: existe y está activo ---
      const mechanic = await manager.findOne(Mechanic, {
        where: { id: dto.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) {
        throw new NotFoundException(`No existe un mecánico con id ${dto.mechanicId}`);
      }
      if (mechanic.status !== MechanicStatus.ACTIVE) {
        throw new ConflictException(
          `El mecánico ${mechanic.name} está inactivo y no puede ser asignado`,
        );
      }

      // --- Taller: existe y está activo ---
      const workshop = await manager.findOne(Workshop, {
        where: { id: dto.workshopId },
      });
      if (!workshop) {
        throw new NotFoundException(`No existe un taller con id ${dto.workshopId}`);
      }
      if (workshop.status !== WorkshopStatus.ACTIVE) {
        throw new ConflictException(
          `El taller ${workshop.name} está inactivo y no puede ser asignado`,
        );
      }

      // --- Un vehículo solo puede tener UN mantenimiento activo ---
      const vehicleBusy = await manager.exists(Maintenance, {
        where: {
          vehicleId: vehicle.id,
          status: In(ACTIVE_MAINTENANCE_STATUSES),
        },
      });
      if (vehicleBusy) {
        throw new ConflictException(
          `El vehículo ${vehicle.plate} ya tiene un mantenimiento activo`,
        );
      }

      // --- El mecánico no puede tener horarios cruzados (en ningún taller) ---
      // Dos franjas se cruzan si: existente.inicio < nueva.fin  Y  existente.fin > nueva.inicio
      // Con < y > estrictos, 7:30-9:00 y 9:00-10:00 NO se cruzan (está permitido).
      const overlapping = await manager.findOne(Maintenance, {
        where: {
          mechanicId: mechanic.id,
          status: In(ACTIVE_MAINTENANCE_STATUSES),
          scheduledStart: LessThan(dto.scheduledEnd),
          scheduledEnd: MoreThan(dto.scheduledStart),
        },
      });
      if (overlapping) {
        throw new ConflictException(
          `El mecánico ${mechanic.name} ya tiene un mantenimiento activo entre ` +
            `${overlapping.scheduledStart.toISOString()} y ${overlapping.scheduledEnd.toISOString()}`,
        );
      }

      // El odómetro del vehículo se actualiza con la lectura registrada
      if (dto.mileage > vehicle.mileage) {
        vehicle.mileage = dto.mileage;
        await manager.save(vehicle);
      }

      const maintenance = manager.create(Maintenance, {
        ...dto,
        status: MaintenanceStatus.SCHEDULED, // Estado inicial obligatorio
      });
      const saved = await manager.save(maintenance);

      // (En el Paso 6B aquí se registra la auditoría)

      return saved.id;
    });

    return this.findOne(maintenanceId);
  }

  // =====================================================================
  // CONSULTAS
  // =====================================================================

  /** a. Todos (filtro opcional por estado) */
  findAll(query: FindMaintenancesQueryDto): Promise<Maintenance[]> {
    return this.maintenancesRepository.find({
      where: query.status ? { status: query.status } : {},
      relations: FULL_RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** b. Activos: SCHEDULED o IN_PROGRESS */
  findActive(): Promise<Maintenance[]> {
    return this.maintenancesRepository.find({
      where: { status: In(ACTIVE_MAINTENANCE_STATUSES) },
      relations: FULL_RELATIONS,
      order: { scheduledStart: 'ASC' },
    });
  }

  /** c. Todos los mantenimientos de un vehículo (cualquier estado) */
  async findByVehicle(vehicleId: string): Promise<Maintenance[]> {
    await this.ensureVehicleExists(vehicleId);
    return this.maintenancesRepository.find({
      where: { vehicleId },
      relations: FULL_RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** e. Historial: mantenimientos COMPLETED de un vehículo, el más reciente primero */
  async findVehicleHistory(vehicleId: string): Promise<Maintenance[]> {
    await this.ensureVehicleExists(vehicleId);
    return this.maintenancesRepository.find({
      where: { vehicleId, status: MaintenanceStatus.COMPLETED },
      relations: FULL_RELATIONS,
      order: { completedAt: 'DESC' },
    });
  }

  /** d. Mantenimientos asignados a un mecánico */
  async findByMechanic(mechanicId: string): Promise<Maintenance[]> {
    await this.mechanicsService.findOne(mechanicId); // 404 si no existe
    return this.maintenancesRepository.find({
      where: { mechanicId },
      relations: FULL_RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** Mantenimientos del técnico que hizo login (incluye el taller de cada uno) */
  async findMine(user: AuthenticatedUser): Promise<Maintenance[]> {
    const mechanic = await this.getMechanicOfUser(user);
    return this.findByMechanic(mechanic.id);
  }

  async findOne(id: string): Promise<Maintenance> {
    const maintenance = await this.maintenancesRepository.findOne({
      where: { id },
      relations: FULL_RELATIONS,
    });
    if (!maintenance) {
      throw new NotFoundException(`No existe un mantenimiento con id ${id}`);
    }
    return maintenance;
  }

  /** ADMIN ve cualquiera; TECHNICIAN solo los que tiene asignados */
  async findOneForUser(id: string, user: AuthenticatedUser): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    if (user.role === UserRole.TECHNICIAN) {
      const mechanic = await this.getMechanicOfUser(user);
      if (maintenance.mechanicId !== mechanic.id) {
        throw new ForbiddenException('Este mantenimiento no está asignado a ti');
      }
    }
    return maintenance;
  }

  // =====================================================================
  // AUXILIARES
  // =====================================================================

  private async getMechanicOfUser(user: AuthenticatedUser): Promise<Mechanic> {
    const mechanic = await this.mechanicsService.findByUserId(user.id);
    if (!mechanic) {
      throw new NotFoundException('Tu usuario no está vinculado a ningún mecánico');
    }
    return mechanic;
  }

  private async ensureVehicleExists(vehicleId: string): Promise<void> {
    const exists = await this.dataSource
      .getRepository(Vehicle)
      .exists({ where: { id: vehicleId } });
    if (!exists) {
      throw new NotFoundException(`No existe un vehículo con id ${vehicleId}`);
    }
  }
}