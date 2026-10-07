import { Controller, Get } from '@nestjs/common';
import { MasterDataService } from './masterdata.service';

@Controller('masterdata')
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
