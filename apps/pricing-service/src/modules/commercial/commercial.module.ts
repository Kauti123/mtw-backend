import { Module } from '@nestjs/common';
import { CommercialRepository } from './commercial.repository';
import { CommercialService } from './commercial.service';
import {
  ConvenienceFeesController,
  DiscountRulesController,
  GstRulesController,
  ServiceFeesController,
  SupplierCommissionsController,
} from './commercial.controllers';

@Module({
  controllers: [
    SupplierCommissionsController,
    ServiceFeesController,
    ConvenienceFeesController,
    DiscountRulesController,
    GstRulesController,
  ],
  providers: [CommercialService, CommercialRepository],
  exports: [CommercialService],
})
export class CommercialModule {}
