import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { NotificationModule } from './modules/notifications/notifications.module';

@Module({
  imports: [ConfigModule, NotificationModule],
})
export class AppModule {}
