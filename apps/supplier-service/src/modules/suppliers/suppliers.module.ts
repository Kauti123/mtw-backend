import { Module } from '@nestjs/common';
import { DatabaseModule } from '@mtw/database';
import { SecurityModule } from '@mtw/security';
import { SupplierController } from './suppliers.controller';
import { SupplierService } from './suppliers.service';
import { SuppliersRepository } from './suppliers.repository';

@Module({
  imports: [SecurityModule, DatabaseModule.forRoot({ optional: true })],
  controllers: [SupplierController],
  providers: [SupplierService, SuppliersRepository],
  exports: [SupplierService],
})
export class SupplierModule {}
