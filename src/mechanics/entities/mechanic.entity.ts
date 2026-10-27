import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum MechanicStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Un mecánico NO pertenece a un taller fijo: el taller se define en cada
 * mantenimiento. Opcionalmente se vincula a un usuario TECHNICIAN para que
 * pueda iniciar sesión y ver sus mantenimientos asignados.
 */
@Entity({ name: 'mechanics' })
export class Mechanic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  specialty: string;

  @Column({
    type: 'enum',
    enum: MechanicStatus,
    enumName: 'mechanic_status_enum',
    default: MechanicStatus.ACTIVE,
  })
  status: MechanicStatus;

  // Un usuario técnico solo puede estar vinculado a un mecánico 
  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}