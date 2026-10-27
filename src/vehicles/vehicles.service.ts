import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.ensurePlateIsFree(dto.plate);
    const vehicle = this.vehiclesRepository.create(dto);
    return this.vehiclesRepository.save(vehicle);
  }

  findAll(query: FindVehiclesQueryDto): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: query.status ? { status: query.status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca por id (si el texto es un UUID) o por placa (en cualquier otro caso).
   * Así un solo endpoint sirve para: GET /vehicles/<uuid> y GET /vehicles/ABC123
   */
  async findOne(idOrPlate: string): Promise<Vehicle> {
    const where = isUUID(idOrPlate)
      ? { id: idOrPlate }
      : { plate: idOrPlate.trim().toUpperCase() };

    const vehicle = await this.vehiclesRepository.findOne({ where });
    if (!vehicle) {
      throw new NotFoundException(`No existe un vehículo con id o placa "${idOrPlate}"`);
    }
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.plate && dto.plate !== vehicle.plate) {
      await this.ensurePlateIsFree(dto.plate);
    }

    // El odómetro no retrocede
    if (dto.mileage !== undefined && dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        `El kilometraje (${dto.mileage}) no puede ser menor al actual (${vehicle.mileage})`,
      );
    }

    Object.assign(vehicle, dto);
    return this.vehiclesRepository.save(vehicle);
  }

  /**
   * Inactivación lógica: el registro NO se borra, así se conserva
   * el historial de mantenimientos asociado.
   */
  async deactivate(id: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException('El vehículo ya está inactivo');
    }
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException(
        'No se puede inactivar un vehículo con un mantenimiento en proceso',
      );
    }

    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehiclesRepository.save(vehicle);
  }

  async activate(id: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status !== VehicleStatus.INACTIVE) {
      throw new ConflictException('Solo se puede activar un vehículo INACTIVE');
    }

    vehicle.status = VehicleStatus.AVAILABLE;
    return this.vehiclesRepository.save(vehicle);
  }

  private async ensurePlateIsFree(plate: string): Promise<void> {
    const exists = await this.vehiclesRepository.exists({ where: { plate } });
    if (exists) {
      throw new ConflictException(`Ya existe un vehículo con la placa ${plate}`);
    }
  }
}