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
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { MechanicsService } from './mechanics.service';

@ApiTags('Mechanics')
@ApiBearerAuth()
@Roles(UserRole.ADMIN) // Todo el controlador es solo ADMIN
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar mecánico (ADMIN)' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los mecánicos (ADMIN)' })
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un mecánico (ADMIN)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar mecánico (ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar mecánico (ADMIN)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Inactivar mecánico sin borrar su historial (ADMIN)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.deactivate(id);
  }
}