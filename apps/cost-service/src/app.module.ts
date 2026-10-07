import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { CostModule } from './modules/cost/cost.module';

@Module({
  imports: [ConfigModule, CostModule],
})
export class AppModule {}
