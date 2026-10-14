import { Module } from '@nestjs/common';
import { CorporateBffController } from './corporate-bff.controller';

@Module({
  controllers: [CorporateBffController],
})
export class CorporateBffModule {}
