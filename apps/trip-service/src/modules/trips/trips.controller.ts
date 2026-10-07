import { Controller, Get } from '@nestjs/common';
import { TripService } from './trips.service';

@Controller('trips')
export class TripController {
  constructor(private readonly service: TripService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
