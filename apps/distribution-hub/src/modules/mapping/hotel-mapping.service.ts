import { Injectable } from '@nestjs/common';

/** Unified hotel id mapping across suppliers. */
@Injectable()
export class HotelMappingService {
  async resolveMtwHotelId(_supplierCode: string, _supplierHotelId: string): Promise<string | null> {
    return null;
  }
}
