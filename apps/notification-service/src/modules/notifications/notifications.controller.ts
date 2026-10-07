import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notifications.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('health')
  health() {
    return this.service.health();
  }
}
