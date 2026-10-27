import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Centro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Calle 10 # 20-30, Medellín' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;
}