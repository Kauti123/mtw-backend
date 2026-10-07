import { Controller, Get } from '@nestjs/common';
import { PolicyService } from './policies.service';

@Controller('policies')
export class PolicyController {
  constructor(private readonly service: PolicyService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
