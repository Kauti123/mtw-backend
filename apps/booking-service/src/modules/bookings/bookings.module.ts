import { Module } from '@nestjs/common';
import { DistributionHubModule } from '../../../../distribution-hub/src';
import { BookingController } from './bookings.controller';
import { BookingService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';

@Module({
  imports: [DistributionHubModule],
  controllers: [BookingController],
  providers: [BookingService, BookingsRepository],
  exports: [BookingService],
})
export class BookingModule {}
