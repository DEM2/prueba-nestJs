import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';

import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Registro público: si no envían rol, queda como TECHNICIAN */
  async register(dto: RegisterDto) {
    return this.usersService.create({
      ...dto,
      role: dto.role ?? UserRole.TECHNICIAN,
    });
  }

  /**
   * Login: valida correo + contraseña y devuelve un JWT.
   * Se usa el MISMO mensaje para "no existe" y "contraseña incorrecta"
   * para no revelar qué correos están registrados.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    const validPassword =
      user !== null && (await verify(user.password, dto.password));

    if (!user || !validPassword) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('El usuario está inactivo');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}