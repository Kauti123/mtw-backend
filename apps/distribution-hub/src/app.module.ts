import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { DistributionHubModule } from './modules/hub.module';

@Module({
  imports: [ConfigModule, DistributionHubModule],
})
export class AppModule {}
