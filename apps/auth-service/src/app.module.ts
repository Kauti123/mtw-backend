import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { AuthModule } from './modules/auth/auth.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';

@Module({
  imports: [ConfigModule, AuthModule, AdminUsersModule],
})
export class AppModule {}
