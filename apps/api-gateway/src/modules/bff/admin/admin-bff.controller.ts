import { Controller, Get } from '@nestjs/common';

@Controller('bff/admin')
export class AdminBffController {
  @Get('health')
  health() {
    return { portal: 'admin', status: 'ok' };
  }
}
