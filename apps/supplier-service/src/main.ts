import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  const listenPort = Number(process.env['PORT'] ?? 3015);
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`supplier-service listening on :${listenPort}`);
}
void bootstrap();
