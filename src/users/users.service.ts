import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';

/** Rondas de bcrypt: 10 es el estándar (más alto = más seguro pero más lento) */
const SALT_ROUNDS = 10;

/** Datos necesarios para crear un usuario (vienen del registro o de un ADMIN) */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Crea un usuario guardando la contraseña con hash argon2.
   * Nunca se guarda la contraseña en texto plano.
   */
  async create(data: CreateUserData): Promise<User> {
    const email = data.email.trim().toLowerCase();

    const exists = await this.usersRepository.exists({ where: { email } });
    if (exists) {
      throw new ConflictException(`Ya existe un usuario con el correo ${email}`);
    }

    const user = this.usersRepository.create({
      name: data.name.trim(),
      email,
      password: await hash(data.password, SALT_ROUNDS),
      role: data.role,
    });
    const saved = await this.usersRepository.save(user);

    // Se vuelve a consultar para devolverlo SIN el hash de la contraseña
    return this.usersRepository.findOneOrFail({ where: { id: saved.id } });
  }

  /**
   * Busca por correo INCLUYENDO la contraseña.
   * La entidad tiene password con select: false, así que hay que pedirla
   * explícitamente. Solo se usa en el login para comparar el hash.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /** Busca por id (sin contraseña) */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /** Lista todos los usuarios (sin contraseña) */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'ASC' } });
  }
}