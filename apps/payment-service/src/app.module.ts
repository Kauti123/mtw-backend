import { Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { PaymentModule } from './modules/payments/payments.module';

@Module({
  imports: [ConfigModule, PaymentModule],
})
export class AppModule {}
