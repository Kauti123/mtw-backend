import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { GtaClient } from './gta.client';
import { mapSearchRequest } from './gta.mapper.request';
import { mapSearchResponse } from './gta.mapper.response';

@RegisterAdapter({ code: 'GTA', vertical: 'HOTEL', version: '1' })
@Injectable()
export class GtaAdapter extends BaseSupplierAdapter<'HOTEL'> {
  readonly meta = { code: 'GTA', vertical: 'HOTEL' as const, version: '1' };

  constructor(private readonly client: GtaClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('GTA book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'GTA credentials not loaded' };
  }
}
