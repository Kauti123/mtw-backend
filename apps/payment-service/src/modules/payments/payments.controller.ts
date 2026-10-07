import { Controller, Get } from '@nestjs/common';
import { PaymentService } from './payments.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
