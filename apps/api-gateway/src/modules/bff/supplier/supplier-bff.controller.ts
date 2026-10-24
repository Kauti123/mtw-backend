import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bff-supplier')
@Controller('bff/supplier')
export class SupplierBffController {
  @Get('health')
  @ApiOperation({ summary: 'Supplier portal BFF health probe' })
  @ApiOkResponse({ description: 'Supplier BFF is healthy' })
  health() {
    return { portal: 'supplier', status: 'ok' };
  }
}
