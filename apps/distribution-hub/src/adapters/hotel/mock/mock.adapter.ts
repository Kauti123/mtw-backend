import { Injectable } from '@nestjs/common';
import type {
  BookingConfirmation,
  BookingRequest,
  CancellationResult,
  PriceBreakdown,
  SearchRequest,
  SearchResult,
} from '@mtw/contracts';
import {
  BaseSupplierAdapter,
  RegisterAdapter,
  type HealthStatus,
  type SupplierContext,
} from '../../adapter.types';

function money(amount: number, currency: string): PriceBreakdown {
  const m = { amount, currency };
  return { base: m, taxes: { amount: 0, currency }, fees: { amount: 0, currency }, total: m, currency };
}

@RegisterAdapter({
  code: 'MOCK',
  vertical: 'HOTEL',
  version: '1',
  capabilities: ['search', 'book', 'cancel', 'priceCheck', 'getDetails'],
})
@Injectable()
export class MockHotelAdapter extends BaseSupplierAdapter<'HOTEL'> {
  readonly meta = {
    code: 'MOCK',
    vertical: 'HOTEL' as const,
    version: '1',
    capabilities: ['search', 'book', 'cancel', 'priceCheck', 'getDetails'],
  };

  async search(ctx: SupplierContext, req: SearchRequest): Promise<SearchResult> {
    const currency = req.currency || ctx.currency;
    const destination = req.destination ?? 'DEL';
    return {
      vertical: 'HOTEL',
      partial: false,
      suppliersQueried: ['MOCK'],
      correlationId: ctx.correlationId,
      offers: [
        {
          offerId: `MOCK-HTL-${destination}-001`,
          supplierCode: 'MOCK',
          vertical: 'HOTEL',
          rawRef: `mock:${destination}:001`,
          price: money(4500, currency),
          attributes: {
            hotelName: `Mock Grand ${destination}`,
            stars: 4,
            city: destination,
          },
        },
        {
          offerId: `MOCK-HTL-${destination}-002`,
          supplierCode: 'MOCK',
          vertical: 'HOTEL',
          rawRef: `mock:${destination}:002`,
          price: money(6200, currency),
          attributes: {
            hotelName: `Mock Plaza ${destination}`,
            stars: 5,
            city: destination,
          },
        },
      ],
    };
  }

  async book(ctx: SupplierContext, req: BookingRequest): Promise<BookingConfirmation> {
    return {
      bookingRef: `MTW-${req.idempotencyKey.slice(0, 8).toUpperCase()}`,
      supplierBookingRef: `MOCK-${Date.now()}`,
      supplierCode: 'MOCK',
      status: 'CONFIRMED',
      price: money(4500, req.currency || ctx.currency),
    };
  }

  async cancel(
    _ctx: SupplierContext,
    bookingRef: string,
  ): Promise<CancellationResult> {
    return {
      bookingRef,
      status: 'CANCELLED',
      message: 'Mock cancellation successful',
    };
  }

  async healthCheck(_ctx: SupplierContext): Promise<HealthStatus> {
    return { status: 'HEALTHY', latencyMs: 1 };
  }
}
