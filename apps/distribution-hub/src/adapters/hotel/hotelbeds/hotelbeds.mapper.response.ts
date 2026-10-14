import type { SearchResult } from '@mtw/contracts';

/** HOTELBEDS → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'HOTEL',
    offers: [],
    suppliersQueried: ['HOTELBEDS'],
    partial: false,
    correlationId,
  };
}
