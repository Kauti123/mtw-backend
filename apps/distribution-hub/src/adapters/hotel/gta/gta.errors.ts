import type { SupplierError } from '@mtw/contracts';

export function mapGtaError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'GTA',
    retryable: false,
    raw: { code },
  };
}
