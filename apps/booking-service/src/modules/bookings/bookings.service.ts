import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  BookingConfirmation,
  BookingRequest,
  SearchRequest,
  SearchResult,
} from '@mtw/contracts';
import { BookingOrchestrator } from '../../../../distribution-hub/src';

interface BookingRecord extends BookingConfirmation {
  corporateId: string;
  userId: string;
  vertical: BookingRequest['vertical'];
  travellers: BookingRequest['travellers'];
}

@Injectable()
export class BookingService {
  private readonly store = new Map<string, BookingRecord>();

  constructor(private readonly hub: BookingOrchestrator) {}

  health() {
    return { service: 'booking-service', status: 'ok' };
  }

  search(req: SearchRequest, correlationId: string): Promise<SearchResult> {
    // Booking never talks to suppliers directly — only via Distribution Hub.
    return this.hub.search(req, correlationId);
  }

  async create(req: BookingRequest, correlationId: string): Promise<BookingRecord> {
    const confirmation = await this.hub.book(req, correlationId);
    const record: BookingRecord = {
      ...confirmation,
      corporateId: req.corporateId,
      userId: req.userId,
      vertical: req.vertical,
      travellers: req.travellers,
    };
    this.store.set(record.bookingRef, record);
    return record;
  }

  get(bookingRef: string): BookingRecord {
    const row = this.store.get(bookingRef);
    if (!row) throw new NotFoundException(`Booking ${bookingRef} not found`);
    return row;
  }

  async cancel(bookingRef: string, correlationId: string) {
    const row = this.get(bookingRef);
    const result = await this.hub.cancel(
      row.supplierCode,
      row.vertical,
      bookingRef,
      correlationId,
    );
    row.status = 'CANCELLED';
    this.store.set(bookingRef, row);
    return result;
  }
}
