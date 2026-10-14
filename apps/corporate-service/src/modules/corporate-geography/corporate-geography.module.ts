import { Module } from '@nestjs/common';
import { CorporateGeographyController } from './corporate-geography.controller';
import { CorporateGeographyRepository } from './corporate-geography.repository';
import { CorporateGeographyService } from './corporate-geography.service';

@Module({
  controllers: [CorporateGeographyController],
  providers: [CorporateGeographyService, CorporateGeographyRepository],
  exports: [CorporateGeographyService],
})
export class CorporateGeographyModule {}
