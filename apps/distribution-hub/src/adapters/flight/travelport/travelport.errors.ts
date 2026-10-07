import type { SupplierError } from '@mtw/contracts';

export function mapTravelportError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'TRAVELPORT',
    retryable: false,
    raw: { code },
  };
}
