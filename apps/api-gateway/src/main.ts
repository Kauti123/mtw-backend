import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { setupSwagger } from '@mtw/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, bodyLimit: 8 * 1024 * 1024 }),
    { bufferLogs: true },
  );

  app.setGlobalPrefix('v1', { exclude: ['health', 'metrics'] });
  const origins = [
    'https://misba-dun.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    ...(process.env['CORS_ORIGINS'] ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];
  app.enableCors({
    origin: origins,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-correlation-id'],
  });
  app.enableShutdownHooks();

  setupSwagger(app, {
    title: 'MTW API Gateway',
    description:
      'MTW Corporate Travel Platform — public REST API. Includes every service module (auth, corporates, masterdata, bookings, hub, BFF portals, and health probes).',
    tags: [
      { name: 'health', description: 'Liveness, readiness, and dependency checks' },
      { name: 'metrics', description: 'Prometheus metrics scrape endpoint' },
      {
        name: 'auth',
        description:
          'Login, registration, and token refresh (includes corporate portal login at /auth/corporate/login)',
      },
      {
        name: 'admin-users',
        description: 'Admin portal user CRUD and admin auth (Misba Supervision)',
      },
      { name: 'users', description: 'User directory service' },
      { name: 'roles', description: 'Role CRUD for access control' },
      { name: 'permissions', description: 'Permission catalog and matrix CRUD' },
      { name: 'corporates', description: 'Corporate account CRUD' },
      { name: 'corporate-codes', description: 'Corporate code master CRUD' },
      { name: 'employees', description: 'Corporate employee CRUD' },
      { name: 'departments', description: 'Corporate department master CRUD' },
      { name: 'positions', description: 'Corporate position master CRUD' },
      { name: 'cost-centers', description: 'Corporate cost center master CRUD' },
      { name: 'masterdata', description: 'Master data including corporate account APIs' },
      { name: 'cities', description: 'City master list for autocomplete' },
      { name: 'bookings', description: 'Travel search, booking, and cancellation' },
      { name: 'distribution-hub', description: 'Supplier adapter orchestration' },
      {
        name: 'policies',
        description:
          'Travel policy CRUD and stepwise wizard save (basic info, travel rules, spending, approval, assignment)',
      },
      { name: 'suppliers', description: 'Supplier catalog service' },
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
      { name: 'payments', description: 'Payment service' },
      { name: 'notifications', description: 'Notification service' },
      { name: 'reports', description: 'Reporting service' },
      { name: 'trips', description: 'Trip service' },
      { name: 'cost', description: 'Cost service' },
      { name: 'cms', description: 'Content management service' },
      {
        name: 'audit',
        description:
          'Audit action logs / activity timeline (actor, action, target, result, IP, user-agent)',
      },
      { name: 'bff-admin', description: 'Admin portal BFF' },
      { name: 'bff-corporate', description: 'Corporate portal BFF' },
      { name: 'bff-employee', description: 'Employee portal BFF' },
      { name: 'bff-supplier', description: 'Supplier portal BFF' },
      { name: 'bff-partner', description: 'Partner portal BFF' },
    ],
  });

  const port = Number(process.env['PORT'] ?? 3001);
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `MTW API Gateway listening on :${port} (DEPLOY_MODE=${process.env['DEPLOY_MODE'] ?? 'monolith'}) — Swagger at /docs`,
  );
}

void bootstrap();
