import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop, WorkshopStatus } from './entities/workshop.entity';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopsRepository: Repository<Workshop>,
  ) {}

  async create(dto: CreateWorkshopDto): Promise<Workshop> {
    await this.ensureNameIsFree(dto.name);
    return this.workshopsRepository.save(this.workshopsRepository.create(dto));
  }

  /** Solo talleres ACTIVE (lo que pide el enunciado para el listado) */
  findActive(): Promise<Workshop[]> {
    return this.workshopsRepository.find({
      where: { status: WorkshopStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  /** Todos, incluidos los inactivos (vista de administración) */
  findAll(): Promise<Workshop[]> {
    return this.workshopsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Workshop> {
    const workshop = await this.workshopsRepository.findOne({ where: { id } });
    if (!workshop) {
      throw new NotFoundException(`No existe un taller con id ${id}`);
    }
    return workshop;
  }

  async update(id: string, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOne(id);
    if (dto.name && dto.name !== workshop.name) {
      await this.ensureNameIsFree(dto.name);
    }
    Object.assign(workshop, dto);
    return this.workshopsRepository.save(workshop);
  }

  async activate(id: string): Promise<Workshop> {
    return this.changeStatus(id, WorkshopStatus.ACTIVE);
  }

  async deactivate(id: string): Promise<Workshop> {
    return this.changeStatus(id, WorkshopStatus.INACTIVE);
  }

  private async changeStatus(id: string, status: WorkshopStatus): Promise<Workshop> {
    const workshop = await this.findOne(id);
    if (workshop.status === status) {
      throw new ConflictException(`El taller ya está ${status}`);
    }
    workshop.status = status;
    return this.workshopsRepository.save(workshop);
  }

  private async ensureNameIsFree(name: string): Promise<void> {
    const exists = await this.workshopsRepository.exists({ where: { name } });
    if (exists) {
      throw new ConflictException(`Ya existe un taller llamado "${name}"`);
    }
  }
}