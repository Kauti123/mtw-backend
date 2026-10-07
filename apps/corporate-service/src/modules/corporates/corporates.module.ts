import { Module } from '@nestjs/common';
import { CorporateController } from './corporates.controller';
import { CorporateService } from './corporates.service';
import { CorporatesRepository } from './corporates.repository';

@Module({
  controllers: [CorporateController],
  providers: [CorporateService, CorporatesRepository],
  exports: [CorporateService],
})
export class CorporateModule {}
