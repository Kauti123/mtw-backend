import { Injectable } from '@nestjs/common';
import type { BookingConfirmation, BookingRequest, SearchRequest, SearchResult } from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';
import { GenericTrainClient } from './generic-train.client';
import { mapSearchRequest } from './generic-train.mapper.request';
import { mapSearchResponse } from './generic-train.mapper.response';

@RegisterAdapter({ code: 'GENERIC_TRAIN', vertical: 'TRAIN', version: '1' })
@Injectable()
export class GenericTrainAdapter extends BaseSupplierAdapter<'TRAIN'> {
  readonly meta = { code: 'GENERIC_TRAIN', vertical: 'TRAIN' as const, version: '1' };

  constructor(private readonly client: GenericTrainClient) {
    super();
  }

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const payload = mapSearchRequest(req);
    const raw = await this.client.search(ctx, payload);
    return mapSearchResponse(raw, ctx.correlationId);
  }

  async book(_ctx: SupplierContext, _req: BookingRequest): Promise<BookingConfirmation> {
    throw new Error('GENERIC_TRAIN book not configured — set credentials + implement mapper');
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'DEGRADED', message: 'GENERIC_TRAIN credentials not loaded' };
  }
}
