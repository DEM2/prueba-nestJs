import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
 
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registro público (TECHNICIAN o MANAGER)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // Un login no crea nada: 200 en vez de 201
  @ApiOperation({ summary: 'Inicia sesión y devuelve un JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}