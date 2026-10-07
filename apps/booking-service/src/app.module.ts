import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { BookingModule } from './modules/bookings/bookings.module';

@Module({
  imports: [ConfigModule, BookingModule],
})
export class AppModule {}
