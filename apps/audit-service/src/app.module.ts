import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [ConfigModule, AuditModule],
})
export class AppModule {}
