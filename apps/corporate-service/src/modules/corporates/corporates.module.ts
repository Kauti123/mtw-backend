import { Module } from '@nestjs/common';
import { SecurityModule } from '@mtw/security';
import { CorporateController } from './corporates.controller';
import { CorporateService } from './corporates.service';
import { CorporateRepository } from './corporates.repository';

@Module({
  imports: [SecurityModule],
  controllers: [CorporateController],
  providers: [CorporateService, CorporateRepository],
  exports: [CorporateService],
})
export class CorporateModule {}
