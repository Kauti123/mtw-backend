import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { PricingModule } from './modules/pricing/pricing.module';
import { MarkupRulesModule } from './modules/markup-rules/markup-rules.module';
import { CommercialModule } from './modules/commercial/commercial.module';

@Module({
  imports: [ConfigModule, PricingModule, MarkupRulesModule, CommercialModule],
})
export class AppModule {}
