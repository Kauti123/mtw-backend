import { Module } from '@nestjs/common';
import { MasterDataController } from './masterdata.controller';
import { MasterDataService } from './masterdata.service';
import { MasterdataRepository } from './masterdata.repository';

@Module({
  controllers: [MasterDataController],
  providers: [MasterDataService, MasterdataRepository],
  exports: [MasterDataService],
})
export class MasterDataModule {}
