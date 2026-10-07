import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BookingRequestSchema,
  SearchRequestSchema,
  type BookingRequest,
  type SearchRequest,
} from '@mtw/contracts';
import { BookingOrchestrator } from './orchestrator/booking.orchestrator';
import { AdapterRegistry } from './registry/adapter-registry.service';

@ApiTags('distribution-hub')
@Controller('hub')
export class HubController {
  constructor(
    private readonly orchestrator: BookingOrchestrator,
    private readonly registry: AdapterRegistry,
  ) {}

  @Post('search')
  search(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const req: SearchRequest = SearchRequestSchema.parse(body);
    return this.orchestrator.search(req, correlationId ?? 'local');
  }

  @Post('book')
  book(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const req: BookingRequest = BookingRequestSchema.parse(body);
    return this.orchestrator.book(req, correlationId ?? 'local');
  }

  @Post('cancel')
  cancel(
    @Body()
    body: { supplierCode: string; vertical: BookingRequest['vertical']; bookingRef: string },
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.orchestrator.cancel(
      body.supplierCode,
      body.vertical,
      body.bookingRef,
      correlationId ?? 'local',
    );
  }

  @Get('adapters')
  listAdapters() {
    return this.registry.listEnabled().map((a) => a.meta);
  }

  @Post('webhooks/:supplierCode')
  webhook(@Param('supplierCode') supplierCode: string, @Body() payload: unknown) {
    return { accepted: true, supplierCode, queued: true, payloadType: typeof payload };
  }
}
