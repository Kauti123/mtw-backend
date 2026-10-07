import type { SupplierError } from '@mtw/contracts';

export function mapAmadeusError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'AMADEUS',
    retryable: false,
    raw: { code },
  };
}
