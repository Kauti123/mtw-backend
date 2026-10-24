import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupplierService } from './suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Get('health')
  @ApiOperation({ summary: 'Supplier service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
