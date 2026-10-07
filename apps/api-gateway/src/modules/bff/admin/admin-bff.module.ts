import { Module } from '@nestjs/common';
import { AdminBffController } from './admin-bff.controller';

@Module({
  controllers: [AdminBffController],
})
export class AdminBffModule {}
