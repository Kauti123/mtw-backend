import { Controller, Get } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
