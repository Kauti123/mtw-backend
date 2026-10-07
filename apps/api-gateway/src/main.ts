import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.setGlobalPrefix('v1', { exclude: ['health', 'metrics'] });
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('MTW API Gateway')
    .setDescription('MTW Corporate Travel Platform — public REST API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `MTW API Gateway listening on :${port} (DEPLOY_MODE=${process.env['DEPLOY_MODE'] ?? 'monolith'})`,
  );
}

void bootstrap();
