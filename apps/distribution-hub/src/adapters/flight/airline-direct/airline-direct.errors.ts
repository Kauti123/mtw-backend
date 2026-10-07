import type { SupplierError } from '@mtw/contracts';

export function mapAirlineDirectError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'AIRLINE_DIRECT',
    retryable: false,
    raw: { code },
  };
}
