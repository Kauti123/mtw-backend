import { Controller, Get } from '@nestjs/common';
import { CostService } from './cost.service';

@Controller('cost')
export class CostController {
  constructor(private readonly service: CostService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
