import type { SearchResult } from '@mtw/contracts';

/** TBO → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'HOTEL',
    offers: [],
    suppliersQueried: ['TBO'],
    partial: false,
    correlationId,
  };
}
