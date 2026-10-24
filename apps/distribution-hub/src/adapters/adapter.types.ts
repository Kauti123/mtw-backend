import { SetMetadata } from '@nestjs/common';
import type {
  BookingConfirmation,
  BookingRequest,
  CancellationResult,
  Offer,
  SearchRequest,
  SearchResult,
  Vertical,
} from '@mtw/contracts';

export const ADAPTER_META_KEY = 'mtw:adapter-meta';

export interface AdapterMeta {
  code: string;
  vertical: Vertical;
  version: string;
  capabilities?: string[];
}

export type Capability =
  'search' | 'book' | 'cancel' | 'modify' | 'priceCheck' | 'getDetails' | 'webhook';

export interface SupplierContext {
  credentials: Record<string, unknown>;
  baseUrl: string;
  timeoutMs: number;
  correlationId: string;
  corporateId: string;
  currency: string;
}

export interface HealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs?: number;
  message?: string;
}

export interface PriceCheckResult {
  offerId: string;
  available: boolean;
  priceChanged: boolean;
  price?: Offer['price'];
}

export interface OfferDetails {
  offer: Offer;
  cancellationPolicy?: Record<string, unknown>;
}

export interface ModificationResult {
  bookingRef: string;
  status: string;
}

export interface WebhookResult {
  accepted: boolean;
  bookingRef?: string;
}

export interface SupplierAdapter<_V extends Vertical = Vertical> {
  readonly meta: AdapterMeta;
  capabilities(): Capability[];
  search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult>;
  getDetails?(ctx: SupplierContext, ref: string): Promise<OfferDetails>;
  priceCheck?(ctx: SupplierContext, offerRef: string): Promise<PriceCheckResult>;
  book(ctx: SupplierContext, req: BookingRequest): Promise<BookingConfirmation>;
  cancel?(ctx: SupplierContext, bookingRef: string): Promise<CancellationResult>;
  modify?(
    ctx: SupplierContext,
    bookingRef: string,
    changes: Record<string, unknown>,
  ): Promise<ModificationResult>;
  healthCheck(ctx: SupplierContext): Promise<HealthStatus>;
  handleWebhook?(
    ctx: SupplierContext,
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<WebhookResult>;
}

export function RegisterAdapter(meta: AdapterMeta): ClassDecorator {
  return SetMetadata(ADAPTER_META_KEY, meta);
}

export abstract class BaseSupplierAdapter<
  V extends Vertical = Vertical,
> implements SupplierAdapter<V> {
  abstract readonly meta: AdapterMeta;

  capabilities(): Capability[] {
    return (this.meta.capabilities as Capability[] | undefined) ?? ['search', 'book', 'cancel'];
  }

  abstract search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult>;
  abstract book(ctx: SupplierContext, req: BookingRequest): Promise<BookingConfirmation>;
  abstract healthCheck(ctx: SupplierContext): Promise<HealthStatus>;

  protected mask(value: unknown): unknown {
    const json = JSON.stringify(value);
    return json
      .replace(/("?(?:password|apiKey|token|secret|authorization)"?\s*:\s*")([^"]+)/gi, '$1***')
      .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1***');
  }
}
