import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorators';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { FindMaintenancesQueryDto } from './dto/find-maintenances-query.dto';
import { MaintenancesService } from './maintenances.service';

@ApiTags('Maintenances')
@ApiBearerAuth()
@Roles(UserRole.ADMIN) // Por defecto solo ADMIN
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear mantenimiento (ADMIN). Estado inicial: SCHEDULED' })
  create(
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenancesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Todos los mantenimientos (filtro opcional por estado)' })
  findAll(@Query() query: FindMaintenancesQueryDto) {
    return this.maintenancesService.findAll(query);
  }

  // Las rutas fijas van ANTES de ':id' para que no se confundan con un id
  @Get('active')
  @ApiOperation({ summary: 'Mantenimientos activos (SCHEDULED o IN_PROGRESS)' })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('me')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Mis mantenimientos asignados, con su taller (TECHNICIAN)' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.maintenancesService.findMine(user);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Mantenimientos de un vehículo' })
  findByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @ApiOperation({ summary: 'Historial (COMPLETED) de un vehículo' })
  findVehicleHistory(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.maintenancesService.findVehicleHistory(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @ApiOperation({ summary: 'Mantenimientos asignados a un mecánico' })
  findByMechanic(@Param('mechanicId', ParseUUIDPipe) mechanicId: string) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Detalle de un mantenimiento (TECHNICIAN solo los suyos)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenancesService.findOneForUser(id, user);
  }

    @Get(':id/logs')
  @ApiOperation({ summary: 'Auditoría de cambios de estado (ADMIN)' })
  findLogs(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenancesService.findLogs(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Cambiar estado (TECHNICIAN solo los suyos). COMPLETED exige datos de cierre',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}