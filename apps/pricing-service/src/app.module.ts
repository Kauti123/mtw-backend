import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { PricingModule } from './modules/pricing/pricing.module';

@Module({
  imports: [ConfigModule, PricingModule],
})
export class AppModule {}
