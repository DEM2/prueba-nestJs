import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorators';
import { UserRole } from '../users/entities/user.entity';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopsService } from './workshops.service';

@ApiTags('Workshops')
@ApiBearerAuth()
@Roles(UserRole.ADMIN) // Por defecto solo ADMIN
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar taller (ADMIN)' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Listar talleres activos' })
  findActive() {
    return this.workshopsService.findActive();
  }

  // Va ANTES de ':id' para que "all" no se confunda con un id
  @Get('all')
  @ApiOperation({ summary: 'Listar todos los talleres, incluidos inactivos (ADMIN)' })
  findAll() {
    return this.workshopsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Consultar un taller' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar taller (ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar taller (ADMIN)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Inactivar taller (ADMIN)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.deactivate(id);
  }
}