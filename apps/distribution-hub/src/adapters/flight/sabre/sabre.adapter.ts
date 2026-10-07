import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { SabreClient } from './sabre.client';
import { mapSearchRequest } from './sabre.mapper.request';
import { mapSearchResponse } from './sabre.mapper.response';

@RegisterAdapter({ code: 'SABRE', vertical: 'FLIGHT', version: '1' })
@Injectable()
export class SabreAdapter extends BaseSupplierAdapter<'FLIGHT'> {
  readonly meta = { code: 'SABRE', vertical: 'FLIGHT' as const, version: '1' };

  constructor(private readonly client: SabreClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('SABRE book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'SABRE credentials not loaded' };
  }
}
