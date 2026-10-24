import { Module } from '@nestjs/common';
import { MarkupRulesController } from './markup-rules.controller';
import { MarkupRulesService } from './markup-rules.service';
import { MarkupRulesRepository } from './markup-rules.repository';

@Module({
  controllers: [MarkupRulesController],
  providers: [MarkupRulesService, MarkupRulesRepository],
  exports: [MarkupRulesService],
})
export class MarkupRulesModule {}
