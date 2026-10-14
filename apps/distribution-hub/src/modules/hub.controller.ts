import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@mtw/common';
import {
  BookingConfirmationOpenApi,
  BookingRequestExample,
  BookingRequestOpenApi,
  BookingRequestSchema,
  CancellationResultOpenApi,
  HubCancelRequestExample,
  HubCancelRequestOpenApi,
  HubCancelRequestSchema,
  SearchRequestExample,
  SearchRequestOpenApi,
  SearchRequestSchema,
  SearchResultOpenApi,
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
  @ApiOperation({ summary: 'Search offers across enabled supplier adapters' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiBody({
    schema: SearchRequestOpenApi,
    examples: { default: { summary: 'Hotel search', value: SearchRequestExample } },
  })
  @ApiOkResponse({ schema: SearchResultOpenApi })
  search(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const req: SearchRequest = SearchRequestSchema.parse(body);
    return this.orchestrator.search(req, correlationId ?? 'local');
  }

  @Post('book')
  @ApiOperation({ summary: 'Book an offer through the matching supplier adapter' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiBody({
    schema: BookingRequestOpenApi,
    examples: { default: { summary: 'Book offer', value: BookingRequestExample } },
  })
  @ApiOkResponse({ schema: BookingConfirmationOpenApi })
  book(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const req: BookingRequest = BookingRequestSchema.parse(body);
    return this.orchestrator.book(req, correlationId ?? 'local');
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel a supplier booking' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiBody({
    schema: HubCancelRequestOpenApi,
    examples: { default: { summary: 'Cancel booking', value: HubCancelRequestExample } },
  })
  @ApiOkResponse({ schema: CancellationResultOpenApi })
  cancel(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const parsed = HubCancelRequestSchema.parse(body);
    return this.orchestrator.cancel(
      parsed.supplierCode,
      parsed.vertical,
      parsed.bookingRef,
      correlationId ?? 'local',
    );
  }

  @Get('adapters')
  @ApiOperation({ summary: 'List enabled supplier adapters' })
  @ApiOkResponse({ description: 'Enabled adapter metadata' })
  listAdapters() {
    return this.registry.listEnabled().map((a) => a.meta);
  }

  @Public()
  @Post('webhooks/:supplierCode')
  @ApiOperation({ summary: 'Accept an inbound supplier webhook' })
  @ApiParam({ name: 'supplierCode', description: 'Supplier adapter code' })
  @ApiBody({
    schema: { type: 'object', additionalProperties: true },
    examples: { default: { summary: 'Supplier payload', value: { event: 'booking.updated' } } },
  })
  @ApiOkResponse({ description: 'Webhook accepted for processing' })
  webhook(@Param('supplierCode') supplierCode: string, @Body() payload: unknown) {
    return { accepted: true, supplierCode, queued: true, payloadType: typeof payload };
  }
}
