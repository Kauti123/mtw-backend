import { Injectable, NotFoundException } from '@nestjs/common';
import { CommercialRepository } from './commercial.repository';
import type {
  ConvenienceFeeQueryDto,
  CreateConvenienceFeeDto,
  CreateDiscountRuleDto,
  CreateGstRuleDto,
  CreateServiceFeeDto,
  CreateSupplierCommissionDto,
  DiscountRuleQueryDto,
  GstRuleQueryDto,
  ServiceFeeQueryDto,
  SupplierCommissionQueryDto,
  UpdateCommercialStatusDto,
  UpdateConvenienceFeeDto,
  UpdateDiscountRuleDto,
  UpdateGstRuleDto,
  UpdateServiceFeeDto,
  UpdateSupplierCommissionDto,
} from './dto';

@Injectable()
export class CommercialService {
  constructor(private readonly repository: CommercialRepository) {}

  health() {
    return { service: 'pricing-service-commercial', status: 'ok' };
  }

  // Supplier Commission
  createCommission(input: CreateSupplierCommissionDto) {
    return this.repository.createCommission(input);
  }
  listCommissions(query: SupplierCommissionQueryDto) {
    return this.repository.listCommissions(query);
  }
  async getCommission(id: string) {
    const row = await this.repository.getCommission(id);
    if (!row) throw new NotFoundException(`Supplier commission '${id}' not found.`);
    return row;
  }
  async updateCommission(id: string, input: UpdateSupplierCommissionDto) {
    await this.getCommission(id);
    const updated = await this.repository.updateCommission(id, input);
    if (!updated) throw new NotFoundException(`Failed to update commission '${id}'.`);
    return updated;
  }
  async updateCommissionStatus(id: string, dto: UpdateCommercialStatusDto) {
    return this.updateCommission(id, { status: dto.status });
  }
  async deleteCommission(id: string) {
    const existing = await this.getCommission(id);
    await this.repository.deleteCommission(id);
    return {
      success: true,
      message: `Supplier commission for '${existing.supplierName}' deleted.`,
      id,
    };
  }

  // Service Fee
  createServiceFee(input: CreateServiceFeeDto) {
    return this.repository.createServiceFee(input);
  }
  listServiceFees(query: ServiceFeeQueryDto) {
    return this.repository.listServiceFees(query);
  }
  async getServiceFee(id: string) {
    const row = await this.repository.getServiceFee(id);
    if (!row) throw new NotFoundException(`Service fee '${id}' not found.`);
    return row;
  }
  async updateServiceFee(id: string, input: UpdateServiceFeeDto) {
    await this.getServiceFee(id);
    const updated = await this.repository.updateServiceFee(id, input);
    if (!updated) throw new NotFoundException(`Failed to update service fee '${id}'.`);
    return updated;
  }
  async updateServiceFeeStatus(id: string, dto: UpdateCommercialStatusDto) {
    return this.updateServiceFee(id, { status: dto.status });
  }
  async deleteServiceFee(id: string) {
    const existing = await this.getServiceFee(id);
    await this.repository.deleteServiceFee(id);
    return {
      success: true,
      message: `Service fee '${existing.feeName}' deleted.`,
      id,
    };
  }

  // Convenience Fee
  createConvenienceFee(input: CreateConvenienceFeeDto) {
    return this.repository.createConvenienceFee(input);
  }
  listConvenienceFees(query: ConvenienceFeeQueryDto) {
    return this.repository.listConvenienceFees(query);
  }
  async getConvenienceFee(id: string) {
    const row = await this.repository.getConvenienceFee(id);
    if (!row) throw new NotFoundException(`Convenience fee '${id}' not found.`);
    return row;
  }
  async updateConvenienceFee(id: string, input: UpdateConvenienceFeeDto) {
    await this.getConvenienceFee(id);
    const updated = await this.repository.updateConvenienceFee(id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update convenience fee '${id}'.`);
    }
    return updated;
  }
  async updateConvenienceFeeStatus(id: string, dto: UpdateCommercialStatusDto) {
    return this.updateConvenienceFee(id, { status: dto.status });
  }
  async deleteConvenienceFee(id: string) {
    const existing = await this.getConvenienceFee(id);
    await this.repository.deleteConvenienceFee(id);
    return {
      success: true,
      message: `Convenience fee '${existing.feeName}' deleted.`,
      id,
    };
  }

  // Discount Rule
  createDiscount(input: CreateDiscountRuleDto) {
    return this.repository.createDiscount(input);
  }
  listDiscounts(query: DiscountRuleQueryDto) {
    return this.repository.listDiscounts(query);
  }
  async getDiscount(id: string) {
    const row = await this.repository.getDiscount(id);
    if (!row) throw new NotFoundException(`Discount rule '${id}' not found.`);
    return row;
  }
  async updateDiscount(id: string, input: UpdateDiscountRuleDto) {
    await this.getDiscount(id);
    const updated = await this.repository.updateDiscount(id, input);
    if (!updated) throw new NotFoundException(`Failed to update discount '${id}'.`);
    return updated;
  }
  async updateDiscountStatus(id: string, dto: UpdateCommercialStatusDto) {
    return this.updateDiscount(id, { status: dto.status });
  }
  async deleteDiscount(id: string) {
    const existing = await this.getDiscount(id);
    await this.repository.deleteDiscount(id);
    return {
      success: true,
      message: `Discount rule '${existing.name}' deleted.`,
      id,
    };
  }

  // GST Rule
  createGst(input: CreateGstRuleDto) {
    return this.repository.createGst(input);
  }
  listGst(query: GstRuleQueryDto) {
    return this.repository.listGst(query);
  }
  async getGst(id: string) {
    const row = await this.repository.getGst(id);
    if (!row) throw new NotFoundException(`GST rule '${id}' not found.`);
    return row;
  }
  async updateGst(id: string, input: UpdateGstRuleDto) {
    await this.getGst(id);
    const updated = await this.repository.updateGst(id, input);
    if (!updated) throw new NotFoundException(`Failed to update GST rule '${id}'.`);
    return updated;
  }
  async updateGstStatus(id: string, dto: UpdateCommercialStatusDto) {
    return this.updateGst(id, { status: dto.status });
  }
  async deleteGst(id: string) {
    const existing = await this.getGst(id);
    await this.repository.deleteGst(id);
    return {
      success: true,
      message: `GST rule '${existing.name}' deleted.`,
      id,
    };
  }
}
