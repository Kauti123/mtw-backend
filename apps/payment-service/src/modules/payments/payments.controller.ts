import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get('health')
  @ApiOperation({ summary: 'Payment service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
