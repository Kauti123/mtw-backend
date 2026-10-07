import { Controller, Get } from '@nestjs/common';
import { SupplierService } from './suppliers.service';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
