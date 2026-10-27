import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../users/entities/user.entity';

/** Roles que se pueden elegir en el registro público (ADMIN no) */
export const SELF_REGISTER_ROLES = [UserRole.TECHNICIAN, UserRole.MANAGER];

export class RegisterDto {
  @ApiProperty({ example: 'Laura Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'laura@fleetcore.com' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiPropertyOptional({
    enum: SELF_REGISTER_ROLES,
    default: UserRole.TECHNICIAN,
  })
  @IsOptional()
  @IsIn(SELF_REGISTER_ROLES, {
    message: `El rol debe ser uno de: ${SELF_REGISTER_ROLES.join(', ')}. Los ADMIN solo los crea otro ADMIN`,
  })
  role?: UserRole;
}