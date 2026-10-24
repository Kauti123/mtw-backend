import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bff-employee')
@Controller('bff/employee')
export class EmployeeBffController {
  @Get('health')
  @ApiOperation({ summary: 'Employee portal BFF health probe' })
  @ApiOkResponse({ description: 'Employee BFF is healthy' })
  health() {
    return { portal: 'employee', status: 'ok' };
  }
}
