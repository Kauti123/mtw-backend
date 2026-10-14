import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { PolicyModule } from './modules/policies/policies.module';

@Module({
  imports: [ConfigModule, PolicyModule],
})
export class AppModule {}
