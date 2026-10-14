import { Module } from '@nestjs/common';
import { SecurityModule } from '@mtw/security';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersRepository } from './admin-users.repository';

@Module({
  imports: [SecurityModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminUsersRepository],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
