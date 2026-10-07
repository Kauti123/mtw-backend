import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { TravelportClient } from './travelport.client';
import { mapSearchRequest } from './travelport.mapper.request';
import { mapSearchResponse } from './travelport.mapper.response';

@RegisterAdapter({ code: 'TRAVELPORT', vertical: 'FLIGHT', version: '1' })
@Injectable()
export class TravelportAdapter extends BaseSupplierAdapter<'FLIGHT'> {
  readonly meta = { code: 'TRAVELPORT', vertical: 'FLIGHT' as const, version: '1' };

  constructor(private readonly client: TravelportClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('TRAVELPORT book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'TRAVELPORT credentials not loaded' };
  }
}
