import type { SearchRequest } from '@mtw/contracts';

/** Canonical → MOCK */
export function mapSearchRequest(req: SearchRequest): Record<string, unknown> {
  return {
    destination: req.destination,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    adults: req.adults,
    currency: req.currency,
  };
}
