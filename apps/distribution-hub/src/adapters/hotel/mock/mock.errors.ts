import type { SupplierError } from '@mtw/contracts';

export function mapMockError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'MOCK',
    retryable: false,
    raw: { code },
  };
}
