import { Controller, Get } from '@nestjs/common';

@Controller('bff/employee')
export class EmployeeBffController {
  @Get('health')
  health() {
    return { portal: 'employee', status: 'ok' };
  }
}
