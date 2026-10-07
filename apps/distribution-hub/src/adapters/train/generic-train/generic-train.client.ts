import { Injectable } from '@nestjs/common';
import { UndiciHttpClient } from '@mtw/http-client';
import type { SupplierContext } from '../../adapter.types';

@Injectable()
export class GenericTrainClient {
  constructor(private readonly http: UndiciHttpClient) {}

  async search(ctx: SupplierContext, payload: unknown): Promise<unknown> {
    // TODO: call GENERIC_TRAIN API
    void this.http;
    void ctx;
    void payload;
    return { offers: [] };
  }
}
