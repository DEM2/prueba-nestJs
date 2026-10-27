import type { DataSourceOptions } from 'typeorm';

//import { MaintenanceStatusLog } from '../maintenances/entities/maintenance-status-log.entity';
//import { Maintenance } from '../maintenances/entities/maintenance.entity';
//import { Mechanic } from '../mechanics/entities/mechanic.entity';
import { User } from '../users/entities/user.entity';
//import { Vehicle } from '../vehicles/entities/vehicle.entity';
//import { Workshop } from '../workshops/entities/workshop.entity';

/** Todas las entidades del proyecto */
export const ENTITIES = [
  User,
 /* Vehicle,
  Mechanic,
  Workshop,
  Maintenance,
  MaintenanceStatusLog,*/
];

type EnvReader = (key: string) => string | undefined;

/**
 * Opciones de conexión compartidas por la API y por el seeder,
 * así ambos usan exactamente la misma configuración.
 */
export function buildTypeOrmOptions(env: EnvReader): DataSourceOptions {
  return {
    type: 'postgres',
    host: env('DB_HOST'),
    port: Number(env('DB_PORT') ?? 5432),
    username: env('DB_USERNAME'),
    password: env('DB_PASSWORD'),
    database: env('DB_DATABASE'),
    entities: ENTITIES,
    // El proyecto no usa migraciones: synchronize crea las tablas a partir de las entidades.
    synchronize: env('DB_SYNCHRONIZE') === 'true',
    logging: env('DB_LOGGING') === 'true',
  };
}