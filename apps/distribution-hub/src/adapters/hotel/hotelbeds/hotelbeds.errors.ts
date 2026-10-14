import type { SupplierError } from '@mtw/contracts';

export function mapHotelbedsError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'HOTELBEDS',
    retryable: false,
    raw: { code },
  };
}
