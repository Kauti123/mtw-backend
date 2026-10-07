import { Controller, Get } from '@nestjs/common';

@Controller('bff/partner')
export class PartnerBffController {
  @Get('health')
  health() {
    return { portal: 'partner', status: 'ok' };
  }
}
