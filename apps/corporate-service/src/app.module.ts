import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { CorporateModule } from './modules/corporates/corporates.module';
import { CorporateCodesModule } from './modules/corporate-codes/corporate-codes.module';

@Module({
  imports: [ConfigModule, CorporateModule, CorporateCodesModule],
})
export class AppModule {}
