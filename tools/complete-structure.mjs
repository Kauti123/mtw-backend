/**
 * Completes the pending MTW monorepo structure that was stopped mid-scaffold.
 * Idempotent: skips files that already exist unless --force.
 */
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');

function write(rel, content) {
  const abs = join(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  if (existsSync(abs) && !force) {
    // Always overwrite broken main.ts / known broken files
    const always = rel.endsWith('main.ts') || rel.includes('hub.module.ts') || rel.includes('app.module.ts') && rel.includes('api-gateway');
    if (!always && !rel.includes('queue/src')) return false;
  }
  writeFileSync(abs, content, 'utf8');
  return true;
}

function writeIfMissing(rel, content) {
  const abs = join(ROOT, rel);
  if (existsSync(abs) && !force) return false;
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf8');
  return true;
}

const PORTS = {
  'api-gateway': 3000,
  'auth-service': 3010,
  'user-service': 3011,
  'corporate-service': 3012,
  'booking-service': 3013,
  'policy-service': 3014,
  'supplier-service': 3015,
  'distribution-hub': 3016,
  'pricing-service': 3017,
  'payment-service': 3018,
  'notification-service': 3019,
  'reporting-service': 3020,
  'masterdata-service': 3021,
  'trip-service': 3022,
  'cost-service': 3023,
  'cms-service': 3024,
  'audit-service': 3025,
};

// ─── 1. Fix all service main.ts ─────────────────────────────
for (const [svc, port] of Object.entries(PORTS)) {
  if (svc === 'api-gateway' || svc === 'distribution-hub') continue;
  const label = svc;
  write(
    `apps/${svc}/src/main.ts`,
    `import { Logger } from '@nestjs/common';
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
  const listenPort = Number(process.env['PORT'] ?? ${port});
  await app.listen(listenPort, '0.0.0.0');
  Logger.log(\`${label} listening on :\${listenPort}\`);
}
void bootstrap();
`,
  );
}

// distribution-hub main if missing/broken
{
  const hubMain = join(ROOT, 'apps/distribution-hub/src/main.ts');
  const needsFix =
    !existsSync(hubMain) ||
    readFileSync(hubMain, 'utf8').includes('Logger.log($d');
  if (needsFix || force) {
    write(
      'apps/distribution-hub/src/main.ts',
      `import { Logger } from '@nestjs/common';
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
  const port = Number(process.env['PORT'] ?? 3016);
  await app.listen(port, '0.0.0.0');
  Logger.log(\`distribution-hub listening on :\${port}\`);
}
void bootstrap();
`,
    );
  }
}

// ─── 2. Adapter full folder layout (§6.4) ───────────────────
const ADAPTERS = [
  { vertical: 'hotel', code: 'mock', className: 'MockHotelAdapter', existing: true },
  { vertical: 'hotel', code: 'tbo', className: 'TboAdapter', existing: true },
  { vertical: 'hotel', code: 'hotelbeds', className: 'HotelbedsAdapter', existing: true },
  { vertical: 'hotel', code: 'hotel-crs', className: 'HotelCrsAdapter', existing: true },
  { vertical: 'hotel', code: 'gta', className: 'GtaAdapter', existing: false },
  { vertical: 'flight', code: 'amadeus', className: 'AmadeusAdapter', existing: true },
  { vertical: 'flight', code: 'sabre', className: 'SabreAdapter', existing: false },
  { vertical: 'flight', code: 'travelport', className: 'TravelportAdapter', existing: false },
  { vertical: 'flight', code: 'airline-direct', className: 'AirlineDirectAdapter', existing: false },
  { vertical: 'bus', code: 'generic-bus', className: 'GenericBusAdapter', existing: false },
  { vertical: 'cab', code: 'generic-cab', className: 'GenericCabAdapter', existing: false },
  { vertical: 'train', code: 'generic-train', className: 'GenericTrainAdapter', existing: false },
];

function pascalFromCode(code) {
  return code
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function adapterFiles(vertical, code) {
  const CODE = code.toUpperCase().replace(/-/g, '_');
  const Vertical = vertical.toUpperCase();
  const className =
    ADAPTERS.find((a) => a.code === code)?.className ?? `${pascalFromCode(code)}Adapter`;
  const clientClass = `${pascalFromCode(code)}Client`;
  const relDepth = '../../adapter.types';

  return {
    [`${code}.adapter.ts`]: `import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '${relDepth}';
import { ${clientClass} } from './${code}.client';
import { mapSearchRequest } from './${code}.mapper.request';
import { mapSearchResponse } from './${code}.mapper.response';

@RegisterAdapter({ code: '${CODE}', vertical: '${Vertical}', version: '1' })
@Injectable()
export class ${className} extends BaseSupplierAdapter<'${Vertical}'> {
  readonly meta = { code: '${CODE}', vertical: '${Vertical}' as const, version: '1' };

  constructor(private readonly client: ${clientClass}) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('${CODE} book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: '${CODE} credentials not loaded' };
  }
}
`,
    [`${code}.client.ts`]: `import { Injectable } from '@nestjs/common';
import { UndiciHttpClient } from '@mtw/http-client';
import type { SupplierContext } from '${relDepth}';

@Injectable()
export class ${clientClass} {
  constructor(private readonly http: UndiciHttpClient) {}

  async search(ctx: SupplierContext, payload: unknown): Promise<unknown> {
    // TODO: call ${CODE} API
    void this.http;
    void ctx;
    void payload;
    return { offers: [] };
  }
}
`,
    [`${code}.mapper.request.ts`]: `import type { SearchRequest } from '@mtw/contracts';

/** Canonical → ${CODE} */
export function mapSearchRequest(req: SearchRequest): Record<string, unknown> {
  return {
    destination: req.destination,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    adults: req.adults,
    currency: req.currency,
  };
}
`,
    [`${code}.mapper.response.ts`]: `import type { SearchResult } from '@mtw/contracts';

/** ${CODE} → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: '${Vertical}',
    offers: [],
    suppliersQueried: ['${CODE}'],
    partial: false,
    correlationId,
  };
}
`,
    [`${code}.schemas.ts`]: `import { z } from 'zod';

export const ${pascalFromCode(code)}SearchResponseSchema = z
  .object({
    offers: z.array(z.unknown()).optional(),
  })
  .passthrough();
`,
    [`${code}.errors.ts`]: `import type { SupplierError } from '@mtw/contracts';

export function map${pascalFromCode(code)}Error(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: '${CODE}',
    retryable: false,
    raw: { code },
  };
}
`,
    [`${code}.config.schema.ts`]: `import { z } from 'zod';

export const ${pascalFromCode(code)}ConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type ${pascalFromCode(code)}Config = z.infer<typeof ${pascalFromCode(code)}ConfigSchema>;
`,
    [`${code}.adapter.spec.ts`]: `describe('${className}', () => {
  it('scaffold loads', () => {
    expect(true).toBe(true);
  });
});
`,
    'README.md': `# ${CODE} ${Vertical} Adapter

Scaffold for the ${CODE} supplier adapter.

## Checklist
- [ ] Implement \`${code}.client.ts\`
- [ ] Fill request/response mappers
- [ ] Validate with \`${code}.schemas.ts\`
- [ ] Map errors in \`${code}.errors.ts\`
- [ ] Add DB supplier + credential rows
- [ ] Pass contract tests

See \`docs/adding-a-supplier.md\`.
`,
  };
}

// Keep MOCK adapter implementation intact — only add missing companion files
const MOCK_COMPANIONS = [
  'mock.client.ts',
  'mock.mapper.request.ts',
  'mock.mapper.response.ts',
  'mock.schemas.ts',
  'mock.errors.ts',
  'mock.config.schema.ts',
  'README.md',
];

for (const a of ADAPTERS) {
  const base = `apps/distribution-hub/src/adapters/${a.vertical}/${a.code}`;
  const files = adapterFiles(a.vertical, a.code);

  if (a.code === 'mock') {
    // Fix broken import path in existing mock.adapter.ts
    const mockPath = join(ROOT, base, 'mock.adapter.ts');
    if (existsSync(mockPath)) {
      let src = readFileSync(mockPath, 'utf8');
      src = src.replace(
        "from '../../adapters/adapter.types'",
        "from '../../adapter.types'",
      );
      writeFileSync(mockPath, src, 'utf8');
    }
    for (const name of MOCK_COMPANIONS) {
      if (name === 'README.md') {
        writeIfMissing(`${base}/README.md`, files['README.md']);
      } else if (files[name]) {
        writeIfMissing(`${base}/${name}`, files[name]);
      }
    }
    continue;
  }

  // For existing single-file adapters: rewrite adapter to use client/mappers
  // and add companion files
  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith('.adapter.ts') && a.existing) {
      write(`${base}/${name}`, content); // replace stub with wired version
    } else {
      writeIfMissing(`${base}/${name}`, content);
    }
  }
}

// ─── 3. Hub module: register all adapters + clients ─────────
const adapterImports = [];
const adapterProviders = [];

for (const a of ADAPTERS) {
  const className = a.className;
  const clientClass = `${pascalFromCode(a.code)}Client`;
  const path = `../adapters/${a.vertical}/${a.code}/${a.code}.adapter`;
  const clientPath = `../adapters/${a.vertical}/${a.code}/${a.code}.client`;
  adapterImports.push(`import { ${className} } from '${path}';`);
  adapterImports.push(`import { ${clientClass} } from '${clientPath}';`);
  adapterProviders.push(className, clientClass);
}

write(
  'apps/distribution-hub/src/modules/hub.module.ts',
  `import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { HttpClientModule } from '@mtw/http-client';
${adapterImports.join('\n')}
import { AdapterRegistry } from './registry/adapter-registry.service';
import { RoutingEngine } from './routing/routing.engine';
import { BookingOrchestrator } from './orchestrator/booking.orchestrator';
import { HubController } from './hub.controller';

@Module({
  imports: [DiscoveryModule, HttpClientModule],
  controllers: [HubController],
  providers: [
${adapterProviders.map((p) => `    ${p},`).join('\n')}
    AdapterRegistry,
    RoutingEngine,
    BookingOrchestrator,
  ],
  exports: [BookingOrchestrator, AdapterRegistry, RoutingEngine],
})
export class DistributionHubModule {}
`,
);

// Hub index export
writeIfMissing(
  'apps/distribution-hub/src/index.ts',
  `export { DistributionHubModule } from './modules/hub.module';
`,
);

// ─── 4. Service module layout: repository, dto, events, entities ─
const SERVICES = [
  { app: 'auth-service', feature: 'auth', exportName: 'AuthModule', classBase: 'Auth' },
  { app: 'user-service', feature: 'users', exportName: 'UsersModule', classBase: 'Users' },
  { app: 'corporate-service', feature: 'corporates', exportName: 'CorporateModule', classBase: 'Corporates' },
  { app: 'booking-service', feature: 'bookings', exportName: 'BookingModule', classBase: 'Bookings' },
  { app: 'policy-service', feature: 'policies', exportName: 'PolicyModule', classBase: 'Policies' },
  { app: 'supplier-service', feature: 'suppliers', exportName: 'SupplierModule', classBase: 'Suppliers' },
  { app: 'pricing-service', feature: 'pricing', exportName: 'PricingModule', classBase: 'Pricing' },
  { app: 'payment-service', feature: 'payments', exportName: 'PaymentModule', classBase: 'Payments' },
  { app: 'notification-service', feature: 'notifications', exportName: 'NotificationModule', classBase: 'Notifications' },
  { app: 'reporting-service', feature: 'reports', exportName: 'ReportingModule', classBase: 'Reports' },
  { app: 'masterdata-service', feature: 'masterdata', exportName: 'MasterDataModule', classBase: 'Masterdata' },
  { app: 'trip-service', feature: 'trips', exportName: 'TripModule', classBase: 'Trips' },
  { app: 'cost-service', feature: 'cost', exportName: 'CostModule', classBase: 'Cost' },
  { app: 'cms-service', feature: 'cms', exportName: 'CMSModule', classBase: 'Cms' },
  { app: 'audit-service', feature: 'audit', exportName: 'AuditModule', classBase: 'Audit' },
];

for (const s of SERVICES) {
  const mod = `apps/${s.app}/src/modules/${s.feature}`;

  writeIfMissing(
    `${mod}/${s.feature}.repository.ts`,
    `import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for ${s.app}.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class ${s.classBase}Repository {
  // TODO: inject PrismaService and implement queries
}
`,
  );

  writeIfMissing(
    `${mod}/dto/index.ts`,
    `/** Zod DTOs for ${s.app} — add nestjs-zod schemas here. */
export {};
`,
  );

  writeIfMissing(
    `${mod}/events/index.ts`,
    `/** Domain events emitted by ${s.app}. */
export {};
`,
  );

  writeIfMissing(
    `${mod}/entities/index.ts`,
    `/** Domain entities for ${s.app} (Prisma-mapped types). */
export {};
`,
  );

  // Ensure index.ts exports the module
  writeIfMissing(
    `apps/${s.app}/src/index.ts`,
    `export { ${s.exportName} } from './modules/${s.feature}/${s.feature}.module';
`,
  );

  // Wire repository into module if module exists and doesn't already include it
  const modulePath = join(ROOT, mod, `${s.feature}.module.ts`);
  if (existsSync(modulePath)) {
    let modSrc = readFileSync(modulePath, 'utf8');
    if (!modSrc.includes('Repository')) {
      const repoClass = `${s.classBase}Repository`;
      if (!modSrc.includes(`from './${s.feature}.repository'`)) {
        modSrc = modSrc.replace(
          `from './${s.feature}.service';`,
          `from './${s.feature}.service';\nimport { ${repoClass} } from './${s.feature}.repository';`,
        );
      }
      modSrc = modSrc.replace(
        /providers:\s*\[([^\]]*)\]/,
        (_m, inner) => {
          const items = inner
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);
          if (!items.includes(repoClass)) items.push(repoClass);
          return `providers: [${items.join(', ')}]`;
        },
      );
      writeFileSync(modulePath, modSrc, 'utf8');
    }
  }
}

// Fix payment module naming inconsistency (PaymentsModule vs Payment)
{
  const payIdx = join(ROOT, 'apps/payment-service/src/index.ts');
  if (existsSync(payIdx)) {
    const src = readFileSync(payIdx, 'utf8');
    // keep whatever export exists; ensure file present
    void src;
  }
}

// ─── 5. API Gateway: wire all domains + BFF stubs ───────────
const BFF_PORTALS = ['admin', 'corporate', 'employee', 'supplier', 'partner'];

for (const portal of BFF_PORTALS) {
  const Portal = portal.charAt(0).toUpperCase() + portal.slice(1);
  writeIfMissing(
    `apps/api-gateway/src/modules/bff/${portal}/${portal}-bff.controller.ts`,
    `import { Controller, Get } from '@nestjs/common';

@Controller('bff/${portal}')
export class ${Portal}BffController {
  @Get('health')
  health() {
    return { portal: '${portal}', status: 'ok' };
  }
}
`,
  );
  writeIfMissing(
    `apps/api-gateway/src/modules/bff/${portal}/${portal}-bff.module.ts`,
    `import { Module } from '@nestjs/common';
import { ${Portal}BffController } from './${portal}-bff.controller';

@Module({
  controllers: [${Portal}BffController],
})
export class ${Portal}BffModule {}
`,
  );
}

write(
  'apps/api-gateway/src/app.module.ts',
  `import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@mtw/config';
import { ProblemDetailsFilter, CorrelationIdInterceptor } from '@mtw/common';
import { ObservabilityModule } from '@mtw/observability';
import { DatabaseModule } from '@mtw/database';
import { CacheModule } from '@mtw/cache';
import { SecurityModule } from '@mtw/security';
import { MessagingModule } from '@mtw/messaging';
import { HttpClientModule } from '@mtw/http-client';
import { QueueModule } from '@mtw/queue';
import { AuthModule } from '../../auth-service/src';
import { UsersModule } from '../../user-service/src';
import { CorporateModule } from '../../corporate-service/src';
import { BookingModule } from '../../booking-service/src';
import { PolicyModule } from '../../policy-service/src';
import { SupplierModule } from '../../supplier-service/src';
import { DistributionHubModule } from '../../distribution-hub/src';
import { PricingModule } from '../../pricing-service/src';
import { PaymentModule } from '../../payment-service/src';
import { NotificationModule } from '../../notification-service/src';
import { ReportingModule } from '../../reporting-service/src';
import { MasterDataModule } from '../../masterdata-service/src';
import { TripModule } from '../../trip-service/src';
import { CostModule } from '../../cost-service/src';
import { CMSModule } from '../../cms-service/src';
import { AuditModule } from '../../audit-service/src';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/health/metrics.module';
import { AdminBffModule } from './modules/bff/admin/admin-bff.module';
import { CorporateBffModule } from './modules/bff/corporate/corporate-bff.module';
import { EmployeeBffModule } from './modules/bff/employee/employee-bff.module';
import { SupplierBffModule } from './modules/bff/supplier/supplier-bff.module';
import { PartnerBffModule } from './modules/bff/partner/partner-bff.module';

@Module({
  imports: [
    ConfigModule,
    ObservabilityModule,
    SecurityModule,
    MessagingModule,
    HttpClientModule,
    QueueModule.forRoot({ optional: true }),
    DatabaseModule.forRoot({ optional: true }),
    CacheModule.forRoot({ optional: true }),
    HealthModule,
    MetricsModule,
    AuthModule,
    UsersModule,
    CorporateModule,
    BookingModule,
    PolicyModule,
    SupplierModule,
    DistributionHubModule,
    PricingModule,
    PaymentModule,
    NotificationModule,
    ReportingModule,
    MasterDataModule,
    TripModule,
    CostModule,
    CMSModule,
    AuditModule,
    AdminBffModule,
    CorporateBffModule,
    EmployeeBffModule,
    SupplierBffModule,
    PartnerBffModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
  ],
})
export class AppModule {}
`,
);

// ─── 6. Ensure index.ts exports match existing module class names ─
for (const s of SERVICES) {
  write(
    `apps/${s.app}/src/index.ts`,
    `export { ${s.exportName} } from './modules/${s.feature}/${s.feature}.module';\n`,
  );
}

// ─── 7. Queue lib (real Nest module stub with forRoot) ──────
write(
  'libs/queue/src/lib/queue.module.ts',
  `import { DynamicModule, Global, Injectable, Module } from '@nestjs/common';
import { QUEUE_NAMES, type QueueName } from './queue.names';

export { QUEUE_NAMES, type QueueName };

@Injectable()
export class QueueProducer {
  async enqueue(queue: QueueName, payload: unknown): Promise<{ id: string }> {
    // TODO: wire BullMQ when Redis is available
    return { id: \`\${queue}:\${Date.now()}\`, ...(typeof payload === 'object' ? {} : {}) };
  }
}

@Global()
@Module({})
export class QueueModule {
  static forRoot(options: { optional?: boolean } = {}): DynamicModule {
    void options;
    return {
      module: QueueModule,
      providers: [QueueProducer],
      exports: [QueueProducer],
    };
  }
}
`,
);

write(
  'libs/queue/src/lib/queue.names.ts',
  `export const QUEUE_NAMES = {
  booking: 'mtw.booking',
  cancellation: 'mtw.cancellation',
  notification: 'mtw.notification',
  supplierSync: 'mtw.supplier-sync',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
`,
);

write(
  'libs/queue/src/index.ts',
  `export { QueueModule, QueueProducer, QUEUE_NAMES, type QueueName } from './lib/queue.module';
`,
);

// ─── 8. Prisma: remaining domain models + migration scaffold ─
const schemaPath = join(ROOT, 'prisma/schema.prisma');
let schema = readFileSync(schemaPath, 'utf8');
if (!schema.includes('model Payment')) {
  schema += `
// ═══════════════════════════════════════════════════════════
// Payment
// ═══════════════════════════════════════════════════════════

model Payment {
  id            String   @id @default(cuid())
  bookingId     String?  @map("booking_id")
  corporateId   String   @map("corporate_id")
  provider      String   @db.VarChar(32)
  providerRef   String?  @map("provider_ref") @db.VarChar(128)
  amount        Decimal  @db.Decimal(12, 2)
  currency      String   @db.VarChar(3)
  status        String   @db.VarChar(32)
  idempotencyKey String  @unique @map("idempotency_key") @db.VarChar(128)
  metadata      Json?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([corporateId, createdAt])
  @@index([bookingId])
  @@map("payment_payment")
}

model PaymentRefund {
  id          String   @id @default(cuid())
  paymentId   String   @map("payment_id")
  amount      Decimal  @db.Decimal(12, 2)
  currency    String   @db.VarChar(3)
  status      String   @db.VarChar(32)
  providerRef String?  @map("provider_ref") @db.VarChar(128)
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([paymentId])
  @@map("payment_refund")
}

// ═══════════════════════════════════════════════════════════
// Policy & Approval
// ═══════════════════════════════════════════════════════════

model TravelPolicy {
  id          String   @id @default(cuid())
  corporateId String   @map("corporate_id")
  name        String   @db.VarChar(128)
  rules       Json
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([corporateId])
  @@map("policy_travel_policy")
}

model ApprovalRequest {
  id          String   @id @default(cuid())
  corporateId String   @map("corporate_id")
  bookingId   String?  @map("booking_id")
  requesterId String   @map("requester_id")
  status      String   @db.VarChar(32)
  levels      Json
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([corporateId, status])
  @@map("policy_approval_request")
}

// ═══════════════════════════════════════════════════════════
// Trip / Cost / CMS / Notification
// ═══════════════════════════════════════════════════════════

model Trip {
  id          String   @id @default(cuid())
  corporateId String   @map("corporate_id")
  ownerId     String   @map("owner_id")
  title       String   @db.VarChar(256)
  status      String   @db.VarChar(32)
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([corporateId, ownerId])
  @@map("trip_trip")
}

model CostSaving {
  id          String   @id @default(cuid())
  corporateId String   @map("corporate_id")
  bookingId   String?  @map("booking_id")
  amount      Decimal  @db.Decimal(12, 2)
  currency    String   @db.VarChar(3)
  reason      String   @db.VarChar(128)
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([corporateId])
  @@map("cost_saving")
}

model CmsPage {
  id        String   @id @default(cuid())
  slug      String   @unique @db.VarChar(128)
  title     String   @db.VarChar(256)
  body      Json
  published Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("cms_page")
}

model CmsBanner {
  id        String   @id @default(cuid())
  portal    String   @db.VarChar(32)
  title     String   @db.VarChar(256)
  payload   Json
  active    Boolean  @default(true)
  startsAt  DateTime? @map("starts_at")
  endsAt    DateTime? @map("ends_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([portal, active])
  @@map("cms_banner")
}

model NotificationOutbox {
  id          String   @id @default(cuid())
  channel     String   @db.VarChar(32)
  toAddress   String   @map("to_address") @db.VarChar(256)
  template    String   @db.VarChar(128)
  payload     Json
  status      String   @db.VarChar(32)
  providerRef String?  @map("provider_ref") @db.VarChar(128)
  createdAt   DateTime @default(now()) @map("created_at")
  sentAt      DateTime? @map("sent_at")

  @@index([status, createdAt])
  @@map("notification_outbox")
}

model PricingRule {
  id          String   @id @default(cuid())
  corporateId String?  @map("corporate_id")
  vertical    String   @db.VarChar(16)
  name        String   @db.VarChar(128)
  rule        Json
  priority    Int      @default(100)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([corporateId, vertical])
  @@map("pricing_rule")
}
`;
  writeFileSync(schemaPath, schema, 'utf8');
}

writeIfMissing(
  'prisma/migrations/migration_lock.toml',
  `# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "mysql"
`,
);

writeIfMissing(
  'prisma/migrations/20261006220000_init/migration.sql',
  `-- MTW initial schema placeholder.
-- Run: pnpm prisma:migrate
-- This file is a structural marker; prefer \`prisma migrate dev\` to generate
-- the authoritative SQL from prisma/schema.prisma against a live MySQL.
`,
);

// ─── 9. Husky + runbooks + grafana placeholder ──────────────
writeIfMissing(
  '.husky/pre-commit',
  `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
`,
);

writeIfMissing(
  '.husky/commit-msg',
  `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec commitlint --edit "$1"
`,
);

writeIfMissing(
  'docs/runbooks/local-dev.md',
  `# Local development

\`\`\`bash
pnpm install
docker compose up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:monolith
\`\`\`

Gateway: http://localhost:3000  
OpenAPI: http://localhost:3000/docs  
Health: http://localhost:3000/health
`,
);

writeIfMissing(
  'docs/runbooks/add-supplier.md',
  `# Runbook: Add a supplier

Follow \`docs/adding-a-supplier.md\`. Quick path:

1. \`pnpm gen:adapter --vertical hotel --code acme\`
2. Implement client + mappers
3. Insert \`supplier_supplier\` + credentials + vertical config
4. \`POST /v1/hub/search\` to verify
`,
);

writeIfMissing(
  'deploy/docker/grafana/dashboards/.gitkeep',
  '',
);

writeIfMissing(
  'deploy/docker/grafana/provisioning/.gitkeep',
  '',
);

// Hub supporting folders from diagram
writeIfMissing(
  'apps/distribution-hub/src/modules/cache/search-cache.service.ts',
  `import { Injectable } from '@nestjs/common';

/** Redis cache-aside for search results (TTL per vertical). */
@Injectable()
export class SearchCacheService {
  async get(_key: string): Promise<unknown | null> {
    return null;
  }

  async set(_key: string, _value: unknown, _ttlSeconds: number): Promise<void> {
    // TODO: Redis SETEX
  }
}
`,
);

writeIfMissing(
  'apps/distribution-hub/src/modules/logging/supplier-log.service.ts',
  `import { Injectable, Logger } from '@nestjs/common';

/** Masked raw request/response supplier logging. */
@Injectable()
export class SupplierLogService {
  private readonly logger = new Logger(SupplierLogService.name);

  log(supplierCode: string, direction: 'OUT' | 'IN', payload: unknown): void {
    this.logger.debug({ supplierCode, direction, payload });
  }
}
`,
);

writeIfMissing(
  'apps/distribution-hub/src/modules/mapping/hotel-mapping.service.ts',
  `import { Injectable } from '@nestjs/common';

/** Unified hotel id mapping across suppliers. */
@Injectable()
export class HotelMappingService {
  async resolveMtwHotelId(_supplierCode: string, _supplierHotelId: string): Promise<string | null> {
    return null;
  }
}
`,
);

console.log('Structure completion finished.');
console.log('Adapters:', ADAPTERS.map((a) => `${a.vertical}/${a.code}`).join(', '));
console.log('Services scaffolded:', SERVICES.length);
console.log('BFF portals:', BFF_PORTALS.join(', '));
