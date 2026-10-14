import { Module } from '@nestjs/common';
import { TripController } from './trips.controller';
import { TripService } from './trips.service';
import { TripsRepository } from './trips.repository';

@Module({
  controllers: [TripController],
  providers: [TripService, TripsRepository],
  exports: [TripService],
})
export class TripModule {}
