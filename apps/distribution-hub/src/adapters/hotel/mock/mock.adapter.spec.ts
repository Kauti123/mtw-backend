import { describe, expect, it } from '@jest/globals';
import { MockHotelAdapter } from './mock.adapter';
import type { SupplierContext } from '../../adapter.types';

describe('MockHotelAdapter', () => {
  const adapter = new MockHotelAdapter();
  const ctx: SupplierContext = {
    credentials: {},
    baseUrl: 'mock://local',
    timeoutMs: 1000,
    correlationId: 'test-corr',
    corporateId: 'corp-1',
    currency: 'INR',
  };

  it('returns deterministic hotel offers', async () => {
    const result = await adapter.search(ctx, {
      vertical: 'HOTEL',
      corporateId: 'corp-1',
      currency: 'INR',
      market: 'IN',
      destination: 'BOM',
      adults: 1,
      children: 0,
      rooms: 1,
    });
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.suppliersQueried).toEqual(['MOCK']);
    expect(result.offers[0]?.supplierCode).toBe('MOCK');
  });

  it('books and cancels', async () => {
    const booked = await adapter.book(ctx, {
      vertical: 'HOTEL',
      corporateId: 'corp-1',
      userId: 'user-1',
      offerId: 'MOCK-HTL-BOM-001',
      supplierCode: 'MOCK',
      travellers: [{ type: 'ADT', givenName: 'Asha', familyName: 'Shah' }],
      idempotencyKey: 'idem-test-12345',
      currency: 'INR',
    });
    expect(booked.status).toBe('CONFIRMED');
    const cancelled = await adapter.cancel?.(ctx, booked.bookingRef);
    expect(cancelled?.status).toBe('CANCELLED');
  });
});
