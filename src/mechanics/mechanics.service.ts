import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { Mechanic, MechanicStatus } from './entities/mechanic.entity';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanicsRepository: Repository<Mechanic>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    await this.ensureEmailIsFree(dto.email);
    if (dto.userId) await this.ensureUserCanBeLinked(dto.userId);

    const mechanic = this.mechanicsRepository.create(dto);
    const saved = await this.mechanicsRepository.save(mechanic);
    return this.findOne(saved.id);
  }

  findAll(): Promise<Mechanic[]> {
    return this.mechanicsRepository.find({
      relations: { user: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Mechanic> {
    const mechanic = await this.mechanicsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!mechanic) {
      throw new NotFoundException(`No existe un mecánico con id ${id}`);
    }
    return mechanic;
  }

  /** Busca el mecánico vinculado a un usuario técnico (se usa en el Paso 6) */
  findByUserId(userId: string): Promise<Mechanic | null> {
    return this.mechanicsRepository.findOne({ where: { userId } });
  }

  async update(id: string, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findOne(id);

    if (dto.email && dto.email !== mechanic.email) {
      await this.ensureEmailIsFree(dto.email);
    }
    if (dto.userId && dto.userId !== mechanic.userId) {
      await this.ensureUserCanBeLinked(dto.userId);
    }

    Object.assign(mechanic, dto);
    // Se quita la relación cargada para que TypeORM use el userId nuevo
    mechanic.user = null;
    await this.mechanicsRepository.save(mechanic);
    return this.findOne(id);
  }

  activate(id: string): Promise<Mechanic> {
    return this.changeStatus(id, MechanicStatus.ACTIVE);
  }

  /**
   * Inactivación lógica: el mecánico NO se borra, así su historial de
   * mantenimientos se conserva. Solo deja de poder recibir nuevos.
   */
  deactivate(id: string): Promise<Mechanic> {
    return this.changeStatus(id, MechanicStatus.INACTIVE);
  }

  private async changeStatus(id: string, status: MechanicStatus): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    if (mechanic.status === status) {
      throw new ConflictException(`El mecánico ya está ${status}`);
    }
    mechanic.status = status;
    return this.mechanicsRepository.save(mechanic);
  }

  private async ensureEmailIsFree(email: string): Promise<void> {
    const exists = await this.mechanicsRepository.exists({ where: { email } });
    if (exists) {
      throw new ConflictException(`Ya existe un mecánico con el correo ${email}`);
    }
  }

  /** El usuario debe existir, ser TECHNICIAN y no estar vinculado a otro mecánico */
  private async ensureUserCanBeLinked(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`No existe un usuario con id ${userId}`);
    }
    if (user.role !== UserRole.TECHNICIAN) {
      throw new BadRequestException('Solo se puede vincular un usuario TECHNICIAN');
    }
    const alreadyLinked = await this.mechanicsRepository.exists({ where: { userId } });
    if (alreadyLinked) {
      throw new ConflictException('Ese usuario ya está vinculado a otro mecánico');
    }
  }
}