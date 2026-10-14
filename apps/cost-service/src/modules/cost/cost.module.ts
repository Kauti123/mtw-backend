import { Module } from '@nestjs/common';
import { CostController } from './cost.controller';
import { CostService } from './cost.service';
import { CostRepository } from './cost.repository';

@Module({
  controllers: [CostController],
  providers: [CostService, CostRepository],
  exports: [CostService],
})
export class CostModule {}
