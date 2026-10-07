import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { ReportingModule } from './modules/reports/reports.module';

@Module({
  imports: [ConfigModule, ReportingModule],
})
export class AppModule {}
