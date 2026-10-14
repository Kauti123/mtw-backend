import type { SearchResult } from '@mtw/contracts';

/** GENERIC_CAB → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'CAB',
    offers: [],
    suppliersQueried: ['GENERIC_CAB'],
    partial: false,
    correlationId,
  };
}
