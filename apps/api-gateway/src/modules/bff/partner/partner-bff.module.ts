import { Module } from '@nestjs/common';
import { PartnerBffController } from './partner-bff.controller';

@Module({
  controllers: [PartnerBffController],
})
export class PartnerBffModule {}
