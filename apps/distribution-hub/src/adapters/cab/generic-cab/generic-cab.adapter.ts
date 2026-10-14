import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { GenericCabClient } from './generic-cab.client';
import { mapSearchRequest } from './generic-cab.mapper.request';
import { mapSearchResponse } from './generic-cab.mapper.response';

@RegisterAdapter({ code: 'GENERIC_CAB', vertical: 'CAB', version: '1' })
@Injectable()
export class GenericCabAdapter extends BaseSupplierAdapter<'CAB'> {
  readonly meta = { code: 'GENERIC_CAB', vertical: 'CAB' as const, version: '1' };

  constructor(private readonly client: GenericCabClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('GENERIC_CAB book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'GENERIC_CAB credentials not loaded' };
  }
}
