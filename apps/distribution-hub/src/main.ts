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
    title: 'MTW Distribution Hub',
    description: 'Supplier adapter search, book, cancel, and webhook APIs.',
    tags: [{ name: 'distribution-hub', description: 'Supplier adapter orchestration' }],
  });
  const port = Number(process.env['PORT'] ?? 3016);
  await app.listen(port, '0.0.0.0');
  Logger.log(`distribution-hub listening on :${port} — Swagger at /docs`);
}
void bootstrap();
