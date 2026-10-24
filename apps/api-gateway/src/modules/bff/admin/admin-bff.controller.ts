import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bff-admin')
@Controller('bff/admin')
export class AdminBffController {
  @Get('health')
  @ApiOperation({ summary: 'Admin portal BFF health probe' })
  @ApiOkResponse({ description: 'Admin BFF is healthy' })
  health() {
    return { portal: 'admin', status: 'ok' };
  }
}
