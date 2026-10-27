import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Mechanic } from '../../mechanics/entities/mechanic.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Workshop } from '../../workshops/entities/workshop.entity';
import { MaintenanceStatus, MaintenanceType } from '../enums/maintenance.enums';

/** Postgres devuelve NUMERIC como texto; lo convertimos a number */
const decimalTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'maintenances' })
@Index(['vehicleId', 'status'])
@Index(['mechanicId', 'status'])
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MaintenanceType, enumName: 'maintenance_type_enum' })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  // Kilometraje del vehículo al registrar el mantenimiento
  @Column({ type: 'int' })
  mileage: number;

  // Fecha programada como franja [inicio, fin): se usa para validar cruces de agenda
  @Column({ name: 'scheduled_start', type: 'timestamptz' })
  scheduledStart: Date;

  @Column({ name: 'scheduled_end', type: 'timestamptz' })
  scheduledEnd: Date;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'maintenance_status_enum',
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  // ---------- Relaciones ----------
  // onDelete RESTRICT: nunca se pierde el historial de un vehículo, mecánico o taller
  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'mechanic_id', type: 'uuid' })
  mechanicId: string;

  @ManyToOne(() => Mechanic, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'mechanic_id' })
  mechanic: Mechanic;

  @Column({ name: 'workshop_id', type: 'uuid' })
  workshopId: string;

  @ManyToOne(() => Workshop, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  // ---------- Ejecución y cierre (se llenan en el Paso 6B) ----------
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed: string | null;

  @Column({
    name: 'final_cost',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  finalCost: number | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'final_mileage', type: 'int', nullable: true })
  finalMileage: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}