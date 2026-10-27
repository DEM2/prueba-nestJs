import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorators';
import { UserRole } from '../users/entities/user.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Roles(UserRole.ADMIN) // Por defecto todo el controlador es solo ADMIN
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar vehículo (ADMIN)' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get() 
  @ApiOperation({ summary: 'Listar vehículos ' })
  findAll(@Query() query: FindVehiclesQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get(':idOrPlate')
  @ApiOperation({ summary: 'Consultar vehículo por id o por placa' })
  findOne(@Param('idOrPlate') idOrPlate: string) {
    return this.vehiclesService.findOne(idOrPlate);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo (ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Reactivar vehículo INACTIVE (ADMIN)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.activate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inactivación lógica del vehículo (ADMIN)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.deactivate(id);
  }
}