import type { SupplierError } from '@mtw/contracts';

export function mapHotelCrsError(code: string, message: string): SupplierError {
  return {
    code: 'UNKNOWN',
    message,
    supplierCode: 'HOTEL_CRS',
    retryable: false,
    raw: { code },
  };
}
