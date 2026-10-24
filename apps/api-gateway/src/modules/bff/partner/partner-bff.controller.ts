import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bff-partner')
@Controller('bff/partner')
export class PartnerBffController {
  @Get('health')
  @ApiOperation({ summary: 'Partner portal BFF health probe' })
  @ApiOkResponse({ description: 'Partner BFF is healthy' })
  health() {
    return { portal: 'partner', status: 'ok' };
  }
}
