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
    title: 'MTW Policy Service',
    description:
      'Travel policy APIs with stepwise wizard save (Basic Info → Travel Rules → Spending Limits → Approval → Assign & Review).',
    tags: [
      {
        name: 'policies',
        description: 'Travel policy CRUD and stepwise save endpoints',
      },
    ],
  });
  const listenPort = Number(process.env['PORT'] ?? 3014);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`policy-service listening on :${listenPort} — Swagger at /docs`);
}
void bootstrap();
