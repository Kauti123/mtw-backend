import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { CorporateModule } from './modules/corporates/corporates.module';

@Module({
  imports: [ConfigModule, CorporateModule],
})
export class AppModule {}
