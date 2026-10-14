import type { SupplierError } from '@mtw/contracts';

export function mapTboError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'TBO',
    retryable: false,
    raw: { code },
  };
}
