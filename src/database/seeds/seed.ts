import { NestFactory } from '@nestjs/core';
import { hash } from 'bcrypt';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';

import { AppModule } from '../../app.module';
import { MaintenanceStatusLog } from '../../maintenances/entities/maintenance-status-log.entity';
import { Maintenance } from '../../maintenances/entities/maintenance.entity';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../../maintenances/enums/maintenance.enums';
import { Mechanic, MechanicStatus } from '../../mechanics/entities/mechanic.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { Vehicle, VehicleStatus } from '../../vehicles/entities/vehicle.entity';
import { Workshop, WorkshopStatus } from '../../workshops/entities/workshop.entity';

const SALT_ROUNDS = 10;

/** Contadores para mostrar un resumen al final */
const summary = { created: 0, skipped: 0 };

/**
 * Busca un registro por un campo único; si no existe lo crea.
 * Esto es lo que hace que el seeder se pueda ejecutar varias veces
 * sin duplicar información (idempotente).
 */
async function findOrCreate<T extends ObjectLiteral>(
  manager: EntityManager,
  entity: EntityTarget<T>,
   where: FindOptionsWhere<NoInfer<T>>,
  data: () => Promise<DeepPartial<NoInfer<T>>> | DeepPartial<NoInfer<T>>,
): Promise<T> {
  const existing = await manager.findOne(entity, { where });
  if (existing) {
    summary.skipped++;
    return existing;
  }
  summary.created++;
  return manager.save(manager.create(entity, await data()));
}

/** Contenido del seed. Todo corre en UNA transacción: o se crea todo o nada. */
async function seed(manager: EntityManager): Promise<void> {
  // ---------------- Usuarios ----------------
  const admin = await findOrCreate(manager, User, { email: 'admin@fleetcore.com' }, async () => ({
    name: 'Administrador FleetCore',
    email: 'admin@fleetcore.com',
    password: await hash('Admin123!', SALT_ROUNDS),
    role: UserRole.ADMIN,
  }));

  const tech1 = await findOrCreate(manager, User, { email: 'tecnico1@fleetcore.com' }, async () => ({
    name: 'Carlos Pérez',
    email: 'tecnico1@fleetcore.com',
    password: await hash('Tecnico123!', SALT_ROUNDS),
    role: UserRole.TECHNICIAN,
  }));

  const tech2 = await findOrCreate(manager, User, { email: 'tecnico2@fleetcore.com' }, async () => ({
    name: 'Laura Gómez',
    email: 'tecnico2@fleetcore.com',
    password: await hash('Tecnico123!', SALT_ROUNDS),
    role: UserRole.TECHNICIAN,
  }));

  // ---------------- Mecánicos (2 activos vinculados + 1 inactivo) ----------------
  const carlos = await findOrCreate(manager, Mechanic, { email: 'carlos.perez@fleetcore.com' }, () => ({
    name: 'Carlos Pérez',
    email: 'carlos.perez@fleetcore.com',
    specialty: 'Motor y transmisión',
    status: MechanicStatus.ACTIVE,
    userId: tech1.id,
  }));

  const laura = await findOrCreate(manager, Mechanic, { email: 'laura.gomez@fleetcore.com' }, () => ({
    name: 'Laura Gómez',
    email: 'laura.gomez@fleetcore.com',
    specialty: 'Frenos y suspensión',
    status: MechanicStatus.ACTIVE,
    userId: tech2.id,
  }));

  await findOrCreate(manager, Mechanic, { email: 'jorge.ramirez@fleetcore.com' }, () => ({
    name: 'Jorge Ramírez',
    email: 'jorge.ramirez@fleetcore.com',
    specialty: 'Sistema eléctrico',
    status: MechanicStatus.INACTIVE,
  }));

  // ---------------- Talleres (1 activo + 1 inactivo) ----------------
  const tallerCentro = await findOrCreate(manager, Workshop, { name: 'Taller Centro' }, () => ({
    name: 'Taller Centro',
    address: 'Calle 10 # 20-30, Medellín',
    status: WorkshopStatus.ACTIVE,
  }));

  const tallerNorte = await findOrCreate(manager, Workshop, { name: 'Taller Norte' }, () => ({
    name: 'Taller Norte',
    address: 'Carrera 50 # 80-15, Bello',
    status: WorkshopStatus.INACTIVE,
  }));

  // ---------------- Vehículos (2 AVAILABLE, 1 IN_MAINTENANCE, 1 INACTIVE) ----------------
  const abc123 = await findOrCreate(manager, Vehicle, { plate: 'ABC123' }, () => ({
    plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2021,
    mileage: 52300, status: VehicleStatus.AVAILABLE,
  }));

  await findOrCreate(manager, Vehicle, { plate: 'DEF456' }, () => ({
    plate: 'DEF456', brand: 'Toyota', model: 'Hilux', year: 2022,
    mileage: 30000, status: VehicleStatus.AVAILABLE,
  }));

  const ghi789 = await findOrCreate(manager, Vehicle, { plate: 'GHI789' }, () => ({
    plate: 'GHI789', brand: 'Ford', model: 'Cargo 1723', year: 2020,
    mileage: 88000, status: VehicleStatus.IN_MAINTENANCE,
  }));

  await findOrCreate(manager, Vehicle, { plate: 'JKL012' }, () => ({
    plate: 'JKL012', brand: 'Renault', model: 'Kangoo', year: 2018,
    mileage: 120000, status: VehicleStatus.INACTIVE,
  }));

  // ---------------- Mantenimientos ----------------
  // Historial: 2 COMPLETED de ABC123
  await seedMaintenance(manager, admin.id, {
    type: MaintenanceType.PREVENTIVE,
    description: 'Cambio de aceite y filtros',
    mileage: 45000,
    scheduledStart: new Date('2026-09-15T08:00:00-05:00'),
    scheduledEnd: new Date('2026-09-15T11:00:00-05:00'),
    status: MaintenanceStatus.COMPLETED,
    vehicleId: abc123.id,
    mechanicId: carlos.id,
    workshopId: tallerCentro.id,
    startedAt: new Date('2026-09-15T08:05:00-05:00'),
    workPerformed: 'Cambio de aceite 15W40, filtro de aceite y filtro de aire',
    finalCost: 350000,
    completedAt: new Date('2026-09-15T10:30:00-05:00'),
    finalMileage: 45000,
  });

  // Se hizo en Taller Norte cuando estaba activo: inactivarlo no borra el historial
  await seedMaintenance(manager, admin.id, {
    type: MaintenanceType.CORRECTIVE,
    description: 'Reemplazo de pastillas de freno',
    mileage: 52300,
    scheduledStart: new Date('2026-10-10T07:30:00-05:00'),
    scheduledEnd: new Date('2026-10-10T09:30:00-05:00'),
    status: MaintenanceStatus.COMPLETED,
    vehicleId: abc123.id,
    mechanicId: laura.id,
    workshopId: tallerNorte.id,
    startedAt: new Date('2026-10-10T07:35:00-05:00'),
    workPerformed: 'Cambio de pastillas delanteras y rectificación de discos',
    finalCost: 480000,
    completedAt: new Date('2026-10-10T09:00:00-05:00'),
    finalMileage: 52300,
  });

  // IN_PROGRESS de GHI789 (por eso ese vehículo está IN_MAINTENANCE)
  const now = new Date();
  await seedMaintenance(manager, admin.id, {
    type: MaintenanceType.CORRECTIVE,
    description: 'Revisión de falla en el sistema eléctrico',
    mileage: 88000,
    scheduledStart: new Date(now.getTime() - 60 * 60 * 1000), // empezó hace 1 hora
    scheduledEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000), // termina en 3 horas
    status: MaintenanceStatus.IN_PROGRESS,
    vehicleId: ghi789.id,
    mechanicId: carlos.id,
    workshopId: tallerCentro.id,
    startedAt: new Date(now.getTime() - 60 * 60 * 1000),
  });
}

/**
 * Crea un mantenimiento (si no existe ya ese vehículo + descripción)
 * junto con su rastro de auditoría coherente con el estado final.
 */
async function seedMaintenance(
  manager: EntityManager,
  adminId: string,
  data: DeepPartial<Maintenance>,
): Promise<void> {
  const where = { vehicleId: data.vehicleId, description: data.description };
  const exists = await manager.exists(Maintenance, { where: where as FindOptionsWhere<Maintenance> });
  if (exists) {
    summary.skipped++;
    return;
  }

  const maintenance = await manager.save(manager.create(Maintenance, data));
  summary.created++;

  // Pasos de estado hasta llegar al estado final
  const path: MaintenanceStatus[] = [MaintenanceStatus.SCHEDULED];
  if (maintenance.status !== MaintenanceStatus.SCHEDULED) path.push(MaintenanceStatus.IN_PROGRESS);
  if (maintenance.status === MaintenanceStatus.COMPLETED) path.push(MaintenanceStatus.COMPLETED);

  let from: MaintenanceStatus | null = null;
  for (const to of path) {
    await manager.save(
      manager.create(MaintenanceStatusLog, {
        maintenanceId: maintenance.id,
        fromStatus: from,
        toStatus: to,
        changedById: adminId,
        note: 'Seeder',
      }),
    );
    from = to;
  }
}

/** Punto de entrada: arranca Nest sin servidor HTTP, ejecuta el seed y cierra */
async function runSeeder(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    await dataSource.transaction(seed);
    console.log(
      `✅ Seed completado. Creados: ${summary.created} | Ya existían: ${summary.skipped}`,
    );
  } finally {
    await app.close();
  }
}

runSeeder().catch((error: unknown) => {
  console.error('❌ Error ejecutando el seeder:', error);
  process.exit(1);
});