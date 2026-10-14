import { Module } from '@nestjs/common';
import { DatabaseModule } from '@mtw/database';
import { SecurityModule } from '@mtw/security';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [SecurityModule, DatabaseModule.forRoot({ optional: true })],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}
