import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

const adapters = [
  { vertical: 'hotel', code: 'tbo', className: 'TboAdapter', clientClass: 'TboClient' },
  { vertical: 'hotel', code: 'hotelbeds', className: 'HotelbedsAdapter', clientClass: 'HotelbedsClient' },
  {
    vertical: 'hotel',
    code: 'hotel-crs',
    className: 'HotelCrsAdapter',
    clientClass: 'HotelCrsClient',
    metaCode: 'HOTEL_CRS',
  },
  { vertical: 'flight', code: 'amadeus', className: 'AmadeusAdapter', clientClass: 'AmadeusClient' },
];

for (const a of adapters) {
  const CODE = a.metaCode ?? a.code.toUpperCase().replace(/-/g, '_');
  const Vertical = a.vertical.toUpperCase();
  const file = join(
    ROOT,
    'apps/distribution-hub/src/adapters',
    a.vertical,
    a.code,
    `${a.code}.adapter.ts`,
  );
  writeFileSync(
    file,
    `import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { ${a.clientClass} } from './${a.code}.client';
import { mapSearchRequest } from './${a.code}.mapper.request';
import { mapSearchResponse } from './${a.code}.mapper.response';

@RegisterAdapter({ code: '${CODE}', vertical: '${Vertical}', version: '1' })
@Injectable()
export class ${a.className} extends BaseSupplierAdapter<'${Vertical}'> {
  readonly meta = { code: '${CODE}', vertical: '${Vertical}' as const, version: '1' };

  constructor(private readonly client: ${a.clientClass}) {
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
    'utf8',
  );
  console.log('Updated', a.code);
}

const hubPath = join(ROOT, 'apps/distribution-hub/src/modules/hub.module.ts');
let hub = readFileSync(hubPath, 'utf8');
if (!hub.includes('SearchCacheService')) {
  hub = hub.replace(
    "import { HubController } from './hub.controller';",
    `import { HubController } from './hub.controller';
import { SearchCacheService } from './cache/search-cache.service';
import { SupplierLogService } from './logging/supplier-log.service';
import { HotelMappingService } from './mapping/hotel-mapping.service';`,
  );
  hub = hub.replace(
    '    BookingOrchestrator,',
    `    BookingOrchestrator,
    SearchCacheService,
    SupplierLogService,
    HotelMappingService,`,
  );
  hub = hub.replace(
    'exports: [BookingOrchestrator, AdapterRegistry, RoutingEngine],',
    'exports: [BookingOrchestrator, AdapterRegistry, RoutingEngine, SearchCacheService, HotelMappingService],',
  );
  writeFileSync(hubPath, hub, 'utf8');
  console.log('hub.module patched');
}

// Declarative adapter companion files
const declBase = join(ROOT, 'apps/distribution-hub/src/adapters/declarative');
const declFiles = {
  'declarative.config.schema.ts': `export {
  DeclarativeAdapterDefinitionSchema,
  type DeclarativeAdapterDefinition,
} from './declarative-rest.adapter';
`,
  'README.md': `# Declarative REST Adapter

Config-driven supplier integration (Tier 2). Store a JSON/YAML definition in DB;
Admin Portal can create/test suppliers with zero code.

See \`DeclarativeAdapterDefinitionSchema\` in \`declarative-rest.adapter.ts\`.
`,
};
for (const [name, content] of Object.entries(declFiles)) {
  const p = join(declBase, name);
  if (!existsSync(p)) {
    writeFileSync(p, content, 'utf8');
    console.log('Created', name);
  }
}

console.log('Done');
