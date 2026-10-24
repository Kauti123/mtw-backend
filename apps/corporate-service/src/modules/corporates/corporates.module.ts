import { Module } from '@nestjs/common';
import { CorporateController } from './corporates.controller';
import { CorporateService } from './corporates.service';
import { CorporateRepository } from './corporates.repository';

@Module({
  controllers: [CorporateController],
  providers: [CorporateService, CorporateRepository],
  exports: [CorporateService],
})
export class CorporateModule {}
