import type { SearchResult } from '@mtw/contracts';

/** AMADEUS → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'FLIGHT',
    offers: [],
    suppliersQueried: ['AMADEUS'],
    partial: false,
    correlationId,
  };
}
