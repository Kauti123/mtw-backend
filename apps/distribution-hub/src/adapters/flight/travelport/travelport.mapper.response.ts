import type { SearchResult } from '@mtw/contracts';

/** TRAVELPORT → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'FLIGHT',
    offers: [],
    suppliersQueried: ['TRAVELPORT'],
    partial: false,
    correlationId,
  };
}
