import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CMSService } from './cms.service';

@ApiTags('cms')
@Controller('cms')
export class CMSController {
  constructor(private readonly service: CMSService) {}

  @Get('health')
  @ApiOperation({ summary: 'CMS service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
