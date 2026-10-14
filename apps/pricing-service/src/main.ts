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
    title: 'MTW Pricing Service',
    description: 'Pricing and markup rule APIs.',
    tags: [
      { name: 'pricing', description: 'Pricing service' },
      {
        name: 'markup-rules',
        description: 'Markup rule CRUD for Flight, Hotel, Car, Train, Bus',
      },
      { name: 'supplier-commissions', description: 'Supplier commission CRUD' },
      { name: 'service-fees', description: 'Service fee CRUD' },
      { name: 'convenience-fees', description: 'Convenience fee CRUD' },
      { name: 'discount-rules', description: 'Discount rule CRUD' },
      { name: 'gst-rules', description: 'GST rule CRUD' },
    ],
  });

  const listenPort = Number(process.env['PORT'] ?? 3017);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`pricing-service listening on :${listenPort} — Swagger at /docs`);
}
void bootstrap();
