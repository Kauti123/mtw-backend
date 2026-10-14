import type { SearchResult } from '@mtw/contracts';

/** SABRE → canonical */
export function mapSearchResponse(raw: unknown, correlationId: string): SearchResult {
  void raw;
  return {
    vertical: 'FLIGHT',
    offers: [],
    suppliersQueried: ['SABRE'],
    partial: false,
    correlationId,
  };
}
