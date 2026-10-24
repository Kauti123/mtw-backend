import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Notification service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }
}
