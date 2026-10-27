import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Convierte la placa a mayúsculas sin espacios: " abc123 " -> "ABC123" */
const normalizePlate = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123', description: 'Placa única del vehículo' })
  @Transform(normalizePlate)
  @IsString()
  @Matches(/^[A-Z0-9-]{5,10}$/, {
    message: 'La placa debe tener entre 5 y 10 caracteres (letras, números o guion)',
  })
  plate: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  brand: string;

  @ApiProperty({ example: 'NPR' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 45000, description: 'Kilometraje actual' })
  @IsInt()
  @Min(0)
  mileage: number;
}