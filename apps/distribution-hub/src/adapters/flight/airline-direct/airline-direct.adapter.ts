import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { AirlineDirectClient } from './airline-direct.client';
import { mapSearchRequest } from './airline-direct.mapper.request';
import { mapSearchResponse } from './airline-direct.mapper.response';

@RegisterAdapter({ code: 'AIRLINE_DIRECT', vertical: 'FLIGHT', version: '1' })
@Injectable()
export class AirlineDirectAdapter extends BaseSupplierAdapter<'FLIGHT'> {
  readonly meta = { code: 'AIRLINE_DIRECT', vertical: 'FLIGHT' as const, version: '1' };

  constructor(private readonly client: AirlineDirectClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('AIRLINE_DIRECT book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'AIRLINE_DIRECT credentials not loaded' };
  }
}
