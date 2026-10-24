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
    title: 'MTW Booking Service',
    description: 'Travel search, booking, retrieval, and cancellation APIs.',
    tags: [{ name: 'bookings', description: 'Travel search, booking, and cancellation' }],
  });
  const listenPort = Number(process.env['PORT'] ?? 3013);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`booking-service listening on :${listenPort} — Swagger at /docs`);
}
void bootstrap();
