import { Controller, Get } from '@nestjs/common';
import { ReportingService } from './reports.service';

@Controller('reports')
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
