import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { HotelbedsClient } from './hotelbeds.client';
import { mapSearchRequest } from './hotelbeds.mapper.request';
import { mapSearchResponse } from './hotelbeds.mapper.response';

@RegisterAdapter({ code: 'HOTELBEDS', vertical: 'HOTEL', version: '1' })
@Injectable()
export class HotelbedsAdapter extends BaseSupplierAdapter<'HOTEL'> {
  readonly meta = { code: 'HOTELBEDS', vertical: 'HOTEL' as const, version: '1' };

  constructor(private readonly client: HotelbedsClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('HOTELBEDS book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'HOTELBEDS credentials not loaded' };
  }
}
