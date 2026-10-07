import type { SearchResult } from '@mtw/contracts';

/** MOCK → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'HOTEL',
    offers: [],
    suppliersQueried: ['MOCK'],
    partial: false,
    correlationId,
  };
}
