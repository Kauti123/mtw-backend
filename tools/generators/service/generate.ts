#!/usr/bin/env tsx
/** Usage: pnpm gen:service --name loyalty */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const name = (arg('name') ?? 'example').toLowerCase();
const serviceName = `${name}-service`;
const classBase = `${name[0]?.toUpperCase()}${name.slice(1)}`;
const base = join(process.cwd(), 'apps', serviceName);

if (existsSync(base)) {
  console.error(`Service already exists: ${base}`);
  process.exit(1);
}

mkdirSync(join(base, 'src', 'modules', name, 'dto'), { recursive: true });
mkdirSync(join(base, 'src', 'modules', name, 'events'), { recursive: true });
mkdirSync(join(base, 'src', 'modules', name, 'entities'), { recursive: true });

writeFileSync(
  join(base, 'src', 'app.module.ts'),
  `import { Module } from '@nestjs/common';\nimport { ConfigModule } from '@mtw/config';\nimport { ${classBase}Module } from './modules/${name}/${name}.module';\n\n@Module({\n  imports: [ConfigModule, ${classBase}Module],\n})\nexport class AppModule {}\n`,
);

writeFileSync(
  join(base, 'src', 'modules', name, `${name}.module.ts`),
  `import { Module } from '@nestjs/common';\nimport { ${classBase}Controller } from './${name}.controller';\nimport { ${classBase}Service } from './${name}.service';\nimport { ${classBase}Repository } from './${name}.repository';\n\n@Module({\n  controllers: [${classBase}Controller],\n  providers: [${classBase}Service, ${classBase}Repository],\n  exports: [${classBase}Service],\n})\nexport class ${classBase}Module {}\n`,
);

writeFileSync(
  join(base, 'src', 'modules', name, `${name}.service.ts`),
  `import { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class ${classBase}Service {\n  health() {\n    return { service: '${serviceName}', status: 'ok' };\n  }\n}\n`,
);

writeFileSync(
  join(base, 'src', 'modules', name, `${name}.repository.ts`),
  `import { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class ${classBase}Repository {\n  // TODO: wire Prisma\n}\n`,
);

writeFileSync(
  join(base, 'src', 'modules', name, `${name}.controller.ts`),
  `import { Controller, Get } from '@nestjs/common';\nimport { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';\nimport { ${classBase}Service } from './${name}.service';\n\n@ApiTags('${name}')\n@Controller('${name}')\nexport class ${classBase}Controller {\n  constructor(private readonly service: ${classBase}Service) {}\n\n  @Get('health')\n  @ApiOperation({ summary: '${classBase} service health probe' })\n  @ApiOkResponse({ description: 'Service is healthy' })\n  health() {\n    return this.service.health();\n  }\n}\n`,
);

writeFileSync(join(base, 'src', 'modules', name, 'dto', 'index.ts'), 'export {};\n');
writeFileSync(join(base, 'src', 'modules', name, 'events', 'index.ts'), 'export {};\n');
writeFileSync(join(base, 'src', 'modules', name, 'entities', 'index.ts'), 'export {};\n');

writeFileSync(
  join(base, 'src', 'index.ts'),
  `export { ${classBase}Module } from './modules/${name}/${name}.module';\n`,
);

writeFileSync(
  join(base, 'src', 'main.ts'),
  `import { Logger } from '@nestjs/common';\nimport { NestFactory } from '@nestjs/core';\nimport { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';\nimport { setupSwagger } from '@mtw/common';\nimport { AppModule } from './app.module';\n\nasync function bootstrap(): Promise<void> {\n  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }));\n  app.setGlobalPrefix('v1');\n  setupSwagger(app, {\n    title: 'MTW ${classBase} Service',\n    description: '${classBase} APIs.',\n    tags: [{ name: '${name}', description: '${classBase} service' }],\n  });\n  const port = Number(process.env['PORT'] ?? 3100);\n  await app.listen(port, '0.0.0.0');\n  Logger.log(\`${serviceName} listening on :\${port} — Swagger at /docs\`);\n}\nvoid bootstrap();\n`,
);

console.log(`Created ${serviceName} at ${base}`);
