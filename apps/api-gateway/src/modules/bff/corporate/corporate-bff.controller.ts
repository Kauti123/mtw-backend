import { Controller, Get } from '@nestjs/common';

@Controller('bff/corporate')
export class CorporateBffController {
  @Get('health')
  health() {
    return { portal: 'corporate', status: 'ok' };
  }
}
