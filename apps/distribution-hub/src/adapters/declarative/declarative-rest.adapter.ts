import type {
  BookingConfirmation,
  BookingRequest,
  SearchRequest,
  SearchResult,
} from '@mtw/contracts';
import jsonata from 'jsonata';
import { z } from 'zod';
import { BaseSupplierAdapter, type HealthStatus, type SupplierContext } from '../adapter.types';

export const DeclarativeAdapterDefinitionSchema = z.object({
  code: z.string(),
  vertical: z.enum(['HOTEL', 'FLIGHT', 'BUS', 'CAB', 'TRAIN']),
  version: z.string().default('1'),
  auth: z.object({
    type: z.enum(['apiKey', 'basic', 'oauth2', 'none']),
    headerName: z.string().optional(),
    queryParam: z.string().optional(),
  }),
  endpoints: z.object({
    search: z.string().url(),
    book: z.string().url().optional(),
    cancel: z.string().url().optional(),
    health: z.string().url().optional(),
  }),
  mappings: z.object({
    searchRequest: z.string(), // JSONata
    searchResponse: z.string(), // JSONata → canonical SearchResult shape
  }),
  errorMap: z.record(z.string()).default({}),
});

export type DeclarativeAdapterDefinition = z.infer<typeof DeclarativeAdapterDefinitionSchema>;

/**
 * Config-driven REST adapter. Definition is loaded from DB (Phase 6 admin API).
 * Zero code to add simple REST suppliers — only a validated JSON/YAML definition.
 */
export class DeclarativeRestAdapter extends BaseSupplierAdapter {
  readonly meta;

  constructor(private readonly definition: DeclarativeAdapterDefinition) {
    super();
    this.meta = {
      code: definition.code,
      vertical: definition.vertical,
      version: definition.version,
    };
  }

  static fromJson(raw: unknown): DeclarativeRestAdapter {
    const definition = DeclarativeAdapterDefinitionSchema.parse(raw);
    return new DeclarativeRestAdapter(definition);
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const reqExpr = jsonata(this.definition.mappings.searchRequest);
    const payload = await reqExpr.evaluate(req);
    // Phase 6: HTTP call via UndiciHttpClient using definition.endpoints.search
    void payload;
    void ctx;
    const empty: SearchResult = {
      vertical: this.definition.vertical,
      offers: [],
      suppliersQueried: [this.definition.code],
      partial: false,
      correlationId: ctx.correlationId,
    };
    return empty;
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error(`Declarative adapter ${this.meta.code} book not implemented in definition`);
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'HEALTHY', message: 'declarative definition loaded' };
  }
}
