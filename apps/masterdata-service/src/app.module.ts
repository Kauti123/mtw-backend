import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { MasterDataModule } from './modules/masterdata/masterdata.module';

@Module({
  imports: [ConfigModule, MasterDataModule],
})
export class AppModule {}
