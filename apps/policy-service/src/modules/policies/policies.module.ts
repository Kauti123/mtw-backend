import { Module } from '@nestjs/common';
import { PolicyController } from './policies.controller';
import { PolicyService } from './policies.service';
import { PoliciesRepository } from './policies.repository';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService, PoliciesRepository],
  exports: [PolicyService],
})
export class PolicyModule {}
