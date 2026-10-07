import { Controller, Get } from '@nestjs/common';

@Controller('bff/supplier')
export class SupplierBffController {
  @Get('health')
  health() {
    return { portal: 'supplier', status: 'ok' };
  }
}
