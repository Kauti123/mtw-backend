import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { GenericBusClient } from './generic-bus.client';
import { mapSearchRequest } from './generic-bus.mapper.request';
import { mapSearchResponse } from './generic-bus.mapper.response';

@RegisterAdapter({ code: 'GENERIC_BUS', vertical: 'BUS', version: '1' })
@Injectable()
export class GenericBusAdapter extends BaseSupplierAdapter<'BUS'> {
  readonly meta = { code: 'GENERIC_BUS', vertical: 'BUS' as const, version: '1' };

  constructor(private readonly client: GenericBusClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('GENERIC_BUS book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'GENERIC_BUS credentials not loaded' };
  }
}
