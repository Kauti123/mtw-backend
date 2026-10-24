import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportingService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Reporting service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
