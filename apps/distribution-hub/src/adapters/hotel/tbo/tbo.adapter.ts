import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { TboClient } from './tbo.client';
import { mapSearchRequest } from './tbo.mapper.request';
import { mapSearchResponse } from './tbo.mapper.response';

@RegisterAdapter({ code: 'TBO', vertical: 'HOTEL', version: '1' })
@Injectable()
export class TboAdapter extends BaseSupplierAdapter<'HOTEL'> {
  readonly meta = { code: 'TBO', vertical: 'HOTEL' as const, version: '1' };

  constructor(private readonly client: TboClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('TBO book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'TBO credentials not loaded' };
  }
}
