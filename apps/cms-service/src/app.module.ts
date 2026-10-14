import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { CMSModule } from './modules/cms/cms.module';

@Module({
  imports: [ConfigModule, CMSModule],
})
export class AppModule {}
