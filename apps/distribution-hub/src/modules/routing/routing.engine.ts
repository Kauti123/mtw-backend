import { Injectable, Logger } from '@nestjs/common';
import type { SearchRequest, SearchResult, Vertical } from '@mtw/contracts';
import { AdapterRegistry } from '../registry/adapter-registry.service';
import type { SupplierContext } from '../../adapters/adapter.types';

const TIMEOUT_BUDGET_MS: Record<Vertical, number> = {
  HOTEL: 8_000,
  FLIGHT: 12_000,
  BUS: 8_000,
  CAB: 6_000,
  TRAIN: 8_000,
};

@Injectable()
export class RoutingEngine {
  private readonly logger = new Logger(RoutingEngine.name);

  constructor(private readonly registry: AdapterRegistry) {}

  async search(req: SearchRequest, correlationId: string): Promise<SearchResult> {
    const adapters = this.registry.listByVertical(req.vertical);
    if (adapters.length === 0) {
      return {
        vertical: req.vertical,
        offers: [],
        suppliersQueried: [],
        partial: false,
        correlationId,
      };
    }

    const budget = TIMEOUT_BUDGET_MS[req.vertical];
    const ctxBase: Omit<SupplierContext, 'credentials' | 'baseUrl'> = {
      timeoutMs: budget,
      correlationId,
      corporateId: req.corporateId,
      currency: req.currency,
    };

    const results = await Promise.allSettled(
      adapters.map(async (adapter) => {
        const ctx: SupplierContext = {
          ...ctxBase,
          credentials: { mode: 'SANDBOX' },
          baseUrl: 'mock://local',
        };
        return adapter.search(ctx, req);
      }),
    );

    const offers = [];
    const suppliersQueried: string[] = [];
    let partial = false;

    for (let i = 0; i < results.length; i++) {
      const adapter = adapters[i];
      if (!adapter) continue;
      suppliersQueried.push(adapter.meta.code);
      const result = results[i];
      if (result?.status === 'fulfilled') {
        offers.push(...result.value.offers);
      } else {
        partial = true;
        this.logger.warn(
          `Supplier ${adapter.meta.code} search failed: ${
            result?.status === 'rejected' ? String(result.reason) : 'unknown'
          }`,
        );
      }
    }

    offers.sort((a, b) => a.price.total.amount - b.price.total.amount);

    return {
      vertical: req.vertical,
      offers,
      suppliersQueried,
      partial,
      correlationId,
    };
  }
}
