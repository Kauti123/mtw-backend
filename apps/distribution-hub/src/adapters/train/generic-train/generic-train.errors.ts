import type { SupplierError } from '@mtw/contracts';

export function mapGenericTrainError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'GENERIC_TRAIN',
    retryable: false,
    raw: { code },
  };
}
