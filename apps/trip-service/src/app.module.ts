import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { TripModule } from './modules/trips/trips.module';

@Module({
  imports: [ConfigModule, TripModule],
})
export class AppModule {}
