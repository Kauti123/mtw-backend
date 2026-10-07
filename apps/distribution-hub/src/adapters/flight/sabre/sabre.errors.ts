import type { SupplierError } from '@mtw/contracts';

export function mapSabreError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'SABRE',
    retryable: false,
    raw: { code },
  };
}
