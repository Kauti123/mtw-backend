import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bff-corporate')
@Controller('bff/corporate')
export class CorporateBffController {
  @Get('health')
  @ApiOperation({ summary: 'Corporate portal BFF health probe' })
  @ApiOkResponse({ description: 'Corporate BFF is healthy' })
  health() {
    return { portal: 'corporate', status: 'ok' };
  }
}
