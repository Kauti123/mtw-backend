import { Module } from '@nestjs/common';
import {
  CostCentersController,
  DepartmentsController,
  PositionsController,
} from './org-masters.controller';
import { OrgMastersRepository } from './org-masters.repository';
import { OrgMastersService } from './org-masters.service';

@Module({
  controllers: [DepartmentsController, PositionsController, CostCentersController],
  providers: [OrgMastersService, OrgMastersRepository],
  exports: [OrgMastersService],
})
export class OrgMastersModule {}
