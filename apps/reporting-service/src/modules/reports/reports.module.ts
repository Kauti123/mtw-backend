import { Module } from '@nestjs/common';
import { ReportingController } from './reports.controller';
import { ReportingService } from './reports.service';
import { ReportsRepository } from './reports.repository';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, ReportsRepository],
  exports: [ReportingService],
})
export class ReportingModule {}
