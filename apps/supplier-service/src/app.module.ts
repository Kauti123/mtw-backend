import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { SupplierModule } from './modules/suppliers/suppliers.module';

@Module({
  imports: [ConfigModule, SupplierModule],
})
export class AppModule {}
