import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { HotelCrsClient } from './hotel-crs.client';
import { mapSearchRequest } from './hotel-crs.mapper.request';
import { mapSearchResponse } from './hotel-crs.mapper.response';

@RegisterAdapter({ code: 'HOTEL_CRS', vertical: 'HOTEL', version: '1' })
@Injectable()
export class HotelCrsAdapter extends BaseSupplierAdapter<'HOTEL'> {
  readonly meta = { code: 'HOTEL_CRS', vertical: 'HOTEL' as const, version: '1' };

  constructor(private readonly client: HotelCrsClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('HOTEL_CRS book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'HOTEL_CRS credentials not loaded' };
  }
}
