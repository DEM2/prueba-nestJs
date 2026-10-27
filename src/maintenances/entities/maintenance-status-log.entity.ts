import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { MaintenanceStatus } from '../enums/maintenance.enums';
import { Maintenance } from './maintenance.entity';

/**
 * Auditoría: cada cambio de estado de un mantenimiento queda registrado
 * (de qué estado a qué estado, quién lo hizo y cuándo).
 */
@Entity({ name: 'maintenance_status_logs' })
export class MaintenanceStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'maintenance_id', type: 'uuid' })
  maintenanceId: string;

  @ManyToOne(() => Maintenance, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'maintenance_id' })
  maintenance: Maintenance;

  // null en el primer registro (creación)
  @Column({
    name: 'from_status',
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'maintenance_status_enum',
    nullable: true,
  })
  fromStatus: MaintenanceStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'maintenance_status_enum',
  })
  toStatus: MaintenanceStatus;

  @Column({ name: 'changed_by_id', type: 'uuid', nullable: true })
  changedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}