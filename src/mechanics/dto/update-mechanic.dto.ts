import { PartialType } from '@nestjs/swagger';

import { CreateMechanicDto } from './create-mechanic.dto';

/** El estado no se cambia aquí: usa activate / deactivate */
export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {}