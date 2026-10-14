import type { SupplierError } from '@mtw/contracts';

export function mapGenericBusError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'GENERIC_BUS',
    retryable: false,
    raw: { code },
  };
}
