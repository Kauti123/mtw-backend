import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TripService } from './trips.service';

@ApiTags('trips')
@Controller('trips')
export class TripController {
  constructor(private readonly service: TripService) {}

  @Get('health')
  @ApiOperation({ summary: 'Trip service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
