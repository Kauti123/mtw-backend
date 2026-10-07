import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
})
export class AppModule {}
