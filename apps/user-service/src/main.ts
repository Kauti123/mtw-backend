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
    title: 'MTW User Service',
    description: 'User directory and role management APIs.',
    tags: [
      { name: 'users', description: 'User directory service' },
      { name: 'roles', description: 'Role CRUD for access control' },
      { name: 'permissions', description: 'Permission catalog and matrix CRUD' },
    ],
  });
  const listenPort = Number(process.env['PORT'] ?? 3011);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`user-service listening on :${listenPort} — Swagger at /docs`);
}
void bootstrap();
