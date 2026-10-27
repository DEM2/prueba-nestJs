import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  API_KEY_HEADER,
  SWAGGER_API_KEY_AUTH,
} from './common/constants/metadata-keys';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas empiezan por /api
  app.setGlobalPrefix('api');

  // Valida automáticamente los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentación Swagger en /api/docs
  const config = new DocumentBuilder()
    .setTitle('FleetCore API')
    .setDescription('Gestión de mantenimientos de la flota de vehículos')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: API_KEY_HEADER, in: 'header' },
      SWAGGER_API_KEY_AUTH,
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

void bootstrap();