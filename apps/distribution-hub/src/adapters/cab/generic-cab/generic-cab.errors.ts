import type { SupplierError } from '@mtw/contracts';

export function mapGenericCabError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'GENERIC_CAB',
    retryable: false,
    raw: { code },
  };
}
