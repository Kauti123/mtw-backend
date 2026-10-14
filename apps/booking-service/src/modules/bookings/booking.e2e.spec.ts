import { Test } from '@nestjs/testing';
import { BookingOrchestrator } from '../../../../distribution-hub/src/modules/orchestrator/booking.orchestrator';
import { RoutingEngine } from '../../../../distribution-hub/src/modules/routing/routing.engine';
import { AdapterRegistry } from '../../../../distribution-hub/src/modules/registry/adapter-registry.service';
import { MockHotelAdapter } from '../../../../distribution-hub/src/adapters/hotel/mock/mock.adapter';
import { BookingService } from './bookings.service';
import { DiscoveryModule, Reflector } from '@nestjs/core';

describe('Booking E2E (mock supplier)', () => {
  let bookings: BookingService;
  let registry: AdapterRegistry;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        Reflector,
        MockHotelAdapter,
        AdapterRegistry,
        RoutingEngine,
        BookingOrchestrator,
        BookingService,
      ],
    }).compile();

    await moduleRef.init();
    bookings = moduleRef.get(BookingService);
    registry = moduleRef.get(AdapterRegistry);
  });

  it('registers MOCK adapter', () => {
    expect(registry.get('MOCK', 'HOTEL')).toBeDefined();
  });

  it('search → book → cancel via hub only', async () => {
    const search = await bookings.search(
      {
        vertical: 'HOTEL',
        corporateId: 'corp-1',
        currency: 'INR',
        market: 'IN',
        destination: 'DEL',
        adults: 1,
        children: 0,
        rooms: 1,
      },
      'e2e-1',
    );
    expect(search.offers.length).toBeGreaterThan(0);
    const offer = search.offers[0]!;

    const booked = await bookings.create(
      {
        vertical: 'HOTEL',
        corporateId: 'corp-1',
        userId: 'user-1',
        offerId: offer.offerId,
        supplierCode: offer.supplierCode,
        travellers: [{ type: 'ADT', givenName: 'Riya', familyName: 'Mehta' }],
        idempotencyKey: 'e2e-idem-001',
        currency: 'INR',
      },
      'e2e-1',
    );
    expect(booked.status).toBe('CONFIRMED');

    const cancelled = await bookings.cancel(booked.bookingRef, 'e2e-1');
    expect(cancelled.status).toBe('CANCELLED');
  });
});
