import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CostService } from './cost.service';

@ApiTags('cost')
@Controller('cost')
export class CostController {
  constructor(private readonly service: CostService) {}

  @Get('health')
  @ApiOperation({ summary: 'Cost service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
