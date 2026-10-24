import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { setupSwagger } from '@mtw/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  setupSwagger(app, {
    title: 'MTW Auth Service',
    description: 'Authentication APIs — register, login, refresh tokens, and admin portal users.',
    tags: [
      { name: 'auth', description: 'Login, registration, and token refresh' },
      {
        name: 'admin-users',
        description: 'Admin portal user CRUD and admin auth (Misba Supervision)',
      },
    ],
  });
  const listenPort = Number(process.env['PORT'] ?? 3010);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`auth-service listening on :${listenPort} — Swagger at /docs`);
}
void bootstrap();
