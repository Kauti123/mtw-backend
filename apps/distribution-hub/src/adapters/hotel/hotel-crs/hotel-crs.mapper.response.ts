import type { SearchResult } from '@mtw/contracts';

/** HOTEL_CRS → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'HOTEL',
    offers: [],
    suppliersQueried: ['HOTEL_CRS'],
    partial: false,
    correlationId,
  };
}
