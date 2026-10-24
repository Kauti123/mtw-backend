import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  BookingConfirmationOpenApi,
  BookingRequestExample,
  BookingRequestOpenApi,
  BookingRequestSchema,
  CancellationResultOpenApi,
  SearchRequestExample,
  SearchRequestOpenApi,
  SearchRequestSchema,
  SearchResultOpenApi,
  type SearchRequest,
} from '@mtw/contracts';
import { BookingService } from './bookings.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search travel offers through the distribution hub' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiBody({
    schema: SearchRequestOpenApi,
    examples: { default: { summary: 'Hotel search', value: SearchRequestExample } },
  })
  @ApiOkResponse({ schema: SearchResultOpenApi, description: 'Aggregated supplier offers' })
  search(@Body() body: unknown, @Headers('x-correlation-id') correlationId?: string) {
    const req: SearchRequest = SearchRequestSchema.parse(body);
    return this.bookings.search(req, correlationId ?? 'local');
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking from a selected offer' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiHeader({ name: 'idempotency-key', required: false })
  @ApiBody({
    schema: BookingRequestOpenApi,
    examples: { default: { summary: 'Create booking', value: BookingRequestExample } },
  })
  @ApiCreatedResponse({ schema: BookingConfirmationOpenApi, description: 'Booking confirmation' })
  create(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const parsed = BookingRequestSchema.parse({
      ...(body as object),
      idempotencyKey: idempotencyKey ?? (body as { idempotencyKey?: string }).idempotencyKey,
    });
    return this.bookings.create(parsed, correlationId ?? 'local');
  }

  @Get(':bookingRef')
  @ApiOperation({ summary: 'Get a booking by reference' })
  @ApiParam({ name: 'bookingRef', description: 'Booking reference' })
  @ApiOkResponse({ schema: BookingConfirmationOpenApi, description: 'Booking details' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  get(@Param('bookingRef') bookingRef: string) {
    return this.bookings.get(bookingRef);
  }

  @Post(':bookingRef/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'bookingRef', description: 'Booking reference' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiOkResponse({ schema: CancellationResultOpenApi, description: 'Cancellation result' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  cancel(
    @Param('bookingRef') bookingRef: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.bookings.cancel(bookingRef, correlationId ?? 'local');
  }
}
