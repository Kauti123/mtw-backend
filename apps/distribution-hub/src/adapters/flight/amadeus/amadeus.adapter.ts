import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { AmadeusClient } from './amadeus.client';
import { mapSearchRequest } from './amadeus.mapper.request';
import { mapSearchResponse } from './amadeus.mapper.response';

@RegisterAdapter({ code: 'AMADEUS', vertical: 'FLIGHT', version: '1' })
@Injectable()
export class AmadeusAdapter extends BaseSupplierAdapter<'FLIGHT'> {
  readonly meta = { code: 'AMADEUS', vertical: 'FLIGHT' as const, version: '1' };

  constructor(private readonly client: AmadeusClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('AMADEUS book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'AMADEUS credentials not loaded' };
  }
}
