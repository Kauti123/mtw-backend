import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { SupplierController } from './suppliers.controller';
import { SupplierService } from './suppliers.service';
import { SuppliersRepository } from './suppliers.repository';

@Module({
  imports: [PropertiesModule],
  controllers: [SupplierController],
  providers: [SupplierService, SuppliersRepository],
  exports: [SupplierService, PropertiesModule],
})
export class SupplierModule {}
