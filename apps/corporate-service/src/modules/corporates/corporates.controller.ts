import { Controller, Get } from '@nestjs/common';
import { CorporateService } from './corporates.service';

@Controller('corporates')
export class CorporateController {
  constructor(private readonly service: CorporateService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
