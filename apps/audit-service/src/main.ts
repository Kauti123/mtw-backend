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
    title: 'MTW Audit Service',
    description:
      'Audit action logs and activity timeline for Misba Supervision.',
    tags: [
      {
        name: 'audit',
        description:
          'Audit action logs / activity timeline (actor, action, target, result, IP, user-agent)',
      },
    ],
  });
  const listenPort = Number(process.env['PORT'] ?? 3025);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`audit-service listening on :${listenPort} — Swagger at /docs`);
}
void bootstrap();
