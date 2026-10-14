import { Module } from '@nestjs/common';
import { EmployeeBffController } from './employee-bff.controller';

@Module({
  controllers: [EmployeeBffController],
})
export class EmployeeBffModule {}
