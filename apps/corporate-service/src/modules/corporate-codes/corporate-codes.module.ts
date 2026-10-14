import { Module } from '@nestjs/common';
import { CorporateCodesController } from './corporate-codes.controller';
import { CorporateCodesService } from './corporate-codes.service';
import { CorporateCodesRepository } from './corporate-codes.repository';

@Module({
  controllers: [CorporateCodesController],
  providers: [CorporateCodesService, CorporateCodesRepository],
  exports: [CorporateCodesService],
})
export class CorporateCodesModule {}
