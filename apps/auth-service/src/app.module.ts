import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
})
export class AppModule {}
