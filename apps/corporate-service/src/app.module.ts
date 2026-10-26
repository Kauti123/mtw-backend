import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { CorporateModule } from './modules/corporates/corporates.module';
import { CorporateCodesModule } from './modules/corporate-codes/corporate-codes.module';
import { WalletsModule } from './modules/wallets/wallets.module';

@Module({
  imports: [ConfigModule, CorporateModule, CorporateCodesModule, WalletsModule],
})
export class AppModule {}
