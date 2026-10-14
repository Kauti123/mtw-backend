import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  BookingConfirmation,
  BookingRequest,
  CancellationResult,
  SearchRequest,
  SearchResult,
} from '@mtw/contracts';
import { AdapterRegistry } from '../registry/adapter-registry.service';
import { RoutingEngine } from '../routing/routing.engine';
import type { SupplierContext } from '../../adapters/adapter.types';

@Injectable()
export class BookingOrchestrator {
  constructor(
    private readonly routing: RoutingEngine,
    private readonly registry: AdapterRegistry,
  ) {}

  search(req: SearchRequest, correlationId: string): Promise<SearchResult> {
    return this.routing.search(req, correlationId);
  }

  async book(req: BookingRequest, correlationId: string): Promise<BookingConfirmation> {
    const adapter = this.registry.get(req.supplierCode, req.vertical);
    if (!adapter) {
      throw new NotFoundException(`Adapter ${req.supplierCode}/${req.vertical} not found`);
    }
    const ctx: SupplierContext = {
      credentials: { mode: 'SANDBOX' },
      baseUrl: 'mock://local',
      timeoutMs: 10_000,
      correlationId,
      corporateId: req.corporateId,
      currency: req.currency,
    };
    return adapter.book(ctx, req);
  }

  async cancel(
    supplierCode: string,
    vertical: BookingRequest['vertical'],
    bookingRef: string,
    correlationId: string,
  ): Promise<CancellationResult> {
    const adapter = this.registry.get(supplierCode, vertical);
    if (!adapter?.cancel) {
      throw new NotFoundException(`Cancel not supported for ${supplierCode}`);
    }
    const ctx: SupplierContext = {
      credentials: { mode: 'SANDBOX' },
      baseUrl: 'mock://local',
      timeoutMs: 10_000,
      correlationId,
      corporateId: 'system',
      currency: 'INR',
    };
    return adapter.cancel(ctx, bookingRef);
  }
}
