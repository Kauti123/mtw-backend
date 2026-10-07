import type { SearchResult } from '@mtw/contracts';

/** GTA → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'HOTEL',
    offers: [],
    suppliersQueried: ['GTA'],
    partial: false,
    correlationId,
  };
}
