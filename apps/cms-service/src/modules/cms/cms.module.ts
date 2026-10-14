import { Module } from '@nestjs/common';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';
import { CmsRepository } from './cms.repository';

@Module({
  controllers: [CMSController],
  providers: [CMSService, CmsRepository],
  exports: [CMSService],
})
export class CMSModule {}
