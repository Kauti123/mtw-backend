import type { SearchResult } from '@mtw/contracts';

/** AIRLINE_DIRECT → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'FLIGHT',
    offers: [],
    suppliersQueried: ['AIRLINE_DIRECT'],
    partial: false,
    correlationId,
  };
}
