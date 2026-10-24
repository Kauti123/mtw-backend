import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';

@Module({
  imports: [ConfigModule, UsersModule, RolesModule, PermissionsModule],
})
export class AppModule {}
