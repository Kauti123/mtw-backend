import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BookingRequestSchema,
  SearchRequestSchema,
  type BookingRequest,
  type SearchRequest,
} from '@mtw/contracts';
import { BookingService } from './bookings.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Post('search')
  search(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const req: SearchRequest = SearchRequestSchema.parse(body);
    return this.bookings.search(req, correlationId ?? 'local');
  }

  @Post()
  create(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const parsed = BookingRequestSchema.parse({
      ...(body as object),
      idempotencyKey:
        idempotencyKey ?? (body as { idempotencyKey?: string }).idempotencyKey,
    });
    return this.bookings.create(parsed, correlationId ?? 'local');
  }

  @Get(':bookingRef')
  get(@Param('bookingRef') bookingRef: string) {
    return this.bookings.get(bookingRef);
  }

  @Post(':bookingRef/cancel')
  cancel(
    @Param('bookingRef') bookingRef: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.bookings.cancel(bookingRef, correlationId ?? 'local');
  }
}
