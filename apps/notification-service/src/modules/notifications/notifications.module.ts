import { Module } from '@nestjs/common';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationsRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
