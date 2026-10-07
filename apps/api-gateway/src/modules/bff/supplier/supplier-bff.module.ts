import { Module } from '@nestjs/common';
import { SupplierBffController } from './supplier-bff.controller';

@Module({
  controllers: [SupplierBffController],
})
export class SupplierBffModule {}
