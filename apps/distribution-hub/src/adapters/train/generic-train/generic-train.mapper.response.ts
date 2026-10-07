import type { SearchResult } from '@mtw/contracts';

/** GENERIC_TRAIN → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'TRAIN',
    offers: [],
    suppliersQueried: ['GENERIC_TRAIN'],
    partial: false,
    correlationId,
  };
}
