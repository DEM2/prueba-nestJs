import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { MaintenancesModule } from './maintenances/maintenances.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    // Lee el archivo .env y lo deja disponible en toda la app
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a PostgreSQL usando las variables del .env
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        // Carga sola las entidades de cada módulo (TypeOrmModule.forFeature)
        autoLoadEntities: true,
        // Crea las tablas automáticamente (antes estaba en false y por eso no se creaban)
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
      }),
    }),

    UsersModule,
    AuthModule,
    VehiclesModule,
    WorkshopsModule,
    MechanicsModule,
    MaintenancesModule,
    IntegrationsModule,
  ],
})
export class AppModule { }