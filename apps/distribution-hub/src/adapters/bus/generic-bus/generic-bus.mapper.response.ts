import type { SearchResult } from '@mtw/contracts';

/** GENERIC_BUS → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'BUS',
    offers: [],
    suppliersQueried: ['GENERIC_BUS'],
    partial: false,
    correlationId,
  };
}
