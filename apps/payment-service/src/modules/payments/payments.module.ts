import { Module } from '@nestjs/common';
import { PaymentController } from './payments.controller';
import { PaymentService } from './payments.service';
import { PaymentsRepository } from './payments.repository';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentsRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
