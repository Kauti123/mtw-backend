import { Controller, Get } from '@nestjs/common';
import { CMSService } from './cms.service';

@Controller('cms')
export class CMSController {
  constructor(private readonly service: CMSService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
