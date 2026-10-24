import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import type {
  ConvenienceFeeQueryDto,
  ConvenienceFeeRecord,
  CreateConvenienceFeeDto,
  CreateDiscountRuleDto,
  CreateGstRuleDto,
  CreateServiceFeeDto,
  CreateSupplierCommissionDto,
  DiscountRuleQueryDto,
  DiscountRuleRecord,
  GstRuleQueryDto,
  GstRuleRecord,
  ServiceFeeQueryDto,
  ServiceFeeRecord,
  SupplierCommissionQueryDto,
  SupplierCommissionRecord,
  UpdateConvenienceFeeDto,
  UpdateDiscountRuleDto,
  UpdateGstRuleDto,
  UpdateServiceFeeDto,
  UpdateSupplierCommissionDto,
} from './dto';

type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class CommercialRepository {
  private readonly commissions = new Map<string, SupplierCommissionRecord>();
  private readonly serviceFees = new Map<string, ServiceFeeRecord>();
  private readonly convenienceFees = new Map<string, ConvenienceFeeRecord>();
  private readonly discounts = new Map<string, DiscountRuleRecord>();
  private readonly gstRules = new Map<string, GstRuleRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();
    const commission: SupplierCommissionRecord = {
      id: 'sc_tbo_01',
      supplierName: 'TBO Holidays',
      productType: 'HOTEL',
      commissionType: 'PERCENTAGE',
      value: 10,
      validFrom: '2025-10-01T00:00:00.000Z',
      validTo: '2026-12-31T00:00:00.000Z',
      status: 'ACTIVE',
      remarks: null,
      createdAt: now,
      updatedAt: now,
    };
    this.commissions.set(commission.id, commission);

    const serviceFee: ServiceFeeRecord = {
      id: 'sf_flight_01',
      feeName: 'Flight Service Fee',
      productType: 'FLIGHT',
      feeType: 'FIXED',
      value: 250,
      applicableTo: 'ALL_AGENTS',
      status: 'ACTIVE',
      remarks: null,
      createdAt: now,
      updatedAt: now,
    };
    this.serviceFees.set(serviceFee.id, serviceFee);

    const convenienceFee: ConvenienceFeeRecord = {
      id: 'cf_web_01',
      feeName: 'Web Convenience Fee',
      productType: 'FLIGHT',
      channel: 'WEB',
      value: 75,
      applicableTo: 'ALL_AGENTS',
      status: 'ACTIVE',
      remarks: null,
      createdAt: now,
      updatedAt: now,
    };
    this.convenienceFees.set(convenienceFee.id, convenienceFee);

    const discount: DiscountRuleRecord = {
      id: 'dr_early_01',
      name: 'Early Bird Discount',
      productType: 'FLIGHT',
      discountType: 'PERCENTAGE',
      value: 5,
      minBookingValue: 5000,
      validFrom: '2025-10-01T00:00:00.000Z',
      validTo: null,
      status: 'ACTIVE',
      remarks: null,
      createdAt: now,
      updatedAt: now,
    };
    this.discounts.set(discount.id, discount);

    const gst: GstRuleRecord = {
      id: 'gst_dom_flight_01',
      name: 'Domestic Flight GST',
      productType: 'FLIGHT',
      gstType: 'GST',
      gstPercentage: 5,
      applicableFor: 'DOMESTIC',
      status: 'ACTIVE',
      remarks: null,
      createdAt: now,
      updatedAt: now,
    };
    this.gstRules.set(gst.id, gst);
  }

  private pageOf<T>(items: T[], page: number, limit: number): ListResult<T> {
    const total = items.length;
    return {
      items: items.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private id(prefix: string): string {
    return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }

  private async enqueue(
    aggregateType: string,
    eventType: string,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.outbox) return;
    try {
      await this.outbox.enqueue({
        aggregateType,
        aggregateId: id,
        eventType,
        payload,
      });
    } catch {
      // non-blocking
    }
  }

  // ── Supplier Commission ────────────────────────────────────

  async createCommission(input: CreateSupplierCommissionDto): Promise<SupplierCommissionRecord> {
    const now = new Date().toISOString();
    const record: SupplierCommissionRecord = {
      id: this.id('sc'),
      ...input,
      commissionType: input.commissionType ?? 'PERCENTAGE',
      status: input.status ?? 'ACTIVE',
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
      remarks: input.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.commissions.set(record.id, record);
    if (this.prisma) {
      try {
        await this.prisma.supplierCommission.create({
          data: {
            id: record.id,
            supplierName: record.supplierName,
            productType: record.productType,
            commissionType: record.commissionType,
            value: new Prisma.Decimal(record.value),
            validFrom: record.validFrom ? new Date(record.validFrom) : null,
            validTo: record.validTo ? new Date(record.validTo) : null,
            status: record.status,
            remarks: record.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    await this.enqueue('supplier_commission', 'supplier_commission.created', record.id, {
      id: record.id,
      supplierName: record.supplierName,
    });
    return record;
  }

  async listCommissions(
    query?: SupplierCommissionQueryDto,
  ): Promise<ListResult<SupplierCommissionRecord>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    if (this.prisma) {
      try {
        const where: Prisma.SupplierCommissionWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.productType) where.productType = query.productType;
        if (query?.supplierName) where.supplierName = { contains: query.supplierName };
        if (query?.search) {
          where.OR = [
            { supplierName: { contains: query.search } },
            { remarks: { contains: query.search } },
          ];
        }
        const [rows, total] = await Promise.all([
          this.prisma.supplierCommission.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.supplierCommission.count({ where }),
        ]);
        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((r) => ({
              id: r.id,
              supplierName: r.supplierName,
              productType: r.productType as SupplierCommissionRecord['productType'],
              commissionType: r.commissionType as SupplierCommissionRecord['commissionType'],
              value: Number(r.value),
              validFrom: r.validFrom?.toISOString() ?? null,
              validTo: r.validTo?.toISOString() ?? null,
              status: r.status as SupplierCommissionRecord['status'],
              remarks: r.remarks,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // fallback
      }
    }
    let all = Array.from(this.commissions.values());
    if (query?.status) all = all.filter((i) => i.status === query.status);
    if (query?.productType) all = all.filter((i) => i.productType === query.productType);
    if (query?.supplierName) {
      all = all.filter((i) =>
        i.supplierName.toLowerCase().includes(query.supplierName!.toLowerCase()),
      );
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter(
        (i) =>
          i.supplierName.toLowerCase().includes(s) || (i.remarks ?? '').toLowerCase().includes(s),
      );
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return this.pageOf(all, page, limit);
  }

  async getCommission(id: string): Promise<SupplierCommissionRecord | null> {
    if (this.prisma) {
      try {
        const r = await this.prisma.supplierCommission.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            supplierName: r.supplierName,
            productType: r.productType as SupplierCommissionRecord['productType'],
            commissionType: r.commissionType as SupplierCommissionRecord['commissionType'],
            value: Number(r.value),
            validFrom: r.validFrom?.toISOString() ?? null,
            validTo: r.validTo?.toISOString() ?? null,
            status: r.status as SupplierCommissionRecord['status'],
            remarks: r.remarks,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }
    return this.commissions.get(id) ?? null;
  }

  async updateCommission(
    id: string,
    input: UpdateSupplierCommissionDto,
  ): Promise<SupplierCommissionRecord | null> {
    const existing = await this.getCommission(id);
    if (!existing) return null;
    const updated: SupplierCommissionRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.commissions.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.supplierCommission.update({
          where: { id },
          data: {
            supplierName: updated.supplierName,
            productType: updated.productType,
            commissionType: updated.commissionType,
            value: new Prisma.Decimal(updated.value),
            validFrom: updated.validFrom ? new Date(updated.validFrom) : null,
            validTo: updated.validTo ? new Date(updated.validTo) : null,
            status: updated.status,
            remarks: updated.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    await this.enqueue('supplier_commission', 'supplier_commission.updated', id, {
      id,
    });
    return updated;
  }

  async deleteCommission(id: string): Promise<boolean> {
    const existing = await this.getCommission(id);
    if (!existing) return false;
    this.commissions.delete(id);
    if (this.prisma) {
      try {
        await this.prisma.supplierCommission.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    await this.enqueue('supplier_commission', 'supplier_commission.deleted', id, {
      id,
    });
    return true;
  }

  // ── Service Fee ────────────────────────────────────────────

  async createServiceFee(input: CreateServiceFeeDto): Promise<ServiceFeeRecord> {
    const now = new Date().toISOString();
    const record: ServiceFeeRecord = {
      id: this.id('sf'),
      ...input,
      feeType: input.feeType ?? 'FIXED',
      applicableTo: input.applicableTo ?? 'ALL_AGENTS',
      status: input.status ?? 'ACTIVE',
      remarks: input.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.serviceFees.set(record.id, record);
    if (this.prisma) {
      try {
        await this.prisma.serviceFee.create({
          data: {
            id: record.id,
            feeName: record.feeName,
            productType: record.productType,
            feeType: record.feeType,
            value: new Prisma.Decimal(record.value),
            applicableTo: record.applicableTo,
            status: record.status,
            remarks: record.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return record;
  }

  async listServiceFees(query?: ServiceFeeQueryDto): Promise<ListResult<ServiceFeeRecord>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    if (this.prisma) {
      try {
        const where: Prisma.ServiceFeeWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.productType) where.productType = query.productType;
        if (query?.search) {
          where.OR = [
            { feeName: { contains: query.search } },
            { remarks: { contains: query.search } },
          ];
        }
        const [rows, total] = await Promise.all([
          this.prisma.serviceFee.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.serviceFee.count({ where }),
        ]);
        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((r) => ({
              id: r.id,
              feeName: r.feeName,
              productType: r.productType as ServiceFeeRecord['productType'],
              feeType: r.feeType as ServiceFeeRecord['feeType'],
              value: Number(r.value),
              applicableTo: r.applicableTo as ServiceFeeRecord['applicableTo'],
              status: r.status as ServiceFeeRecord['status'],
              remarks: r.remarks,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // fallback
      }
    }
    let all = Array.from(this.serviceFees.values());
    if (query?.status) all = all.filter((i) => i.status === query.status);
    if (query?.productType) all = all.filter((i) => i.productType === query.productType);
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter((i) => i.feeName.toLowerCase().includes(s));
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return this.pageOf(all, page, limit);
  }

  async getServiceFee(id: string): Promise<ServiceFeeRecord | null> {
    if (this.prisma) {
      try {
        const r = await this.prisma.serviceFee.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            feeName: r.feeName,
            productType: r.productType as ServiceFeeRecord['productType'],
            feeType: r.feeType as ServiceFeeRecord['feeType'],
            value: Number(r.value),
            applicableTo: r.applicableTo as ServiceFeeRecord['applicableTo'],
            status: r.status as ServiceFeeRecord['status'],
            remarks: r.remarks,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }
    return this.serviceFees.get(id) ?? null;
  }

  async updateServiceFee(id: string, input: UpdateServiceFeeDto): Promise<ServiceFeeRecord | null> {
    const existing = await this.getServiceFee(id);
    if (!existing) return null;
    const updated: ServiceFeeRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.serviceFees.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.serviceFee.update({
          where: { id },
          data: {
            feeName: updated.feeName,
            productType: updated.productType,
            feeType: updated.feeType,
            value: new Prisma.Decimal(updated.value),
            applicableTo: updated.applicableTo,
            status: updated.status,
            remarks: updated.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return updated;
  }

  async deleteServiceFee(id: string): Promise<boolean> {
    const existing = await this.getServiceFee(id);
    if (!existing) return false;
    this.serviceFees.delete(id);
    if (this.prisma) {
      try {
        await this.prisma.serviceFee.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    return true;
  }

  // ── Convenience Fee ────────────────────────────────────────

  async createConvenienceFee(input: CreateConvenienceFeeDto): Promise<ConvenienceFeeRecord> {
    const now = new Date().toISOString();
    const record: ConvenienceFeeRecord = {
      id: this.id('cf'),
      ...input,
      channel: input.channel ?? 'WEB',
      applicableTo: input.applicableTo ?? 'ALL_AGENTS',
      status: input.status ?? 'ACTIVE',
      remarks: input.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.convenienceFees.set(record.id, record);
    if (this.prisma) {
      try {
        await this.prisma.convenienceFee.create({
          data: {
            id: record.id,
            feeName: record.feeName,
            productType: record.productType,
            channel: record.channel,
            value: new Prisma.Decimal(record.value),
            applicableTo: record.applicableTo,
            status: record.status,
            remarks: record.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return record;
  }

  async listConvenienceFees(
    query?: ConvenienceFeeQueryDto,
  ): Promise<ListResult<ConvenienceFeeRecord>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    if (this.prisma) {
      try {
        const where: Prisma.ConvenienceFeeWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.productType) where.productType = query.productType;
        if (query?.channel) where.channel = query.channel;
        if (query?.search) where.feeName = { contains: query.search };
        const [rows, total] = await Promise.all([
          this.prisma.convenienceFee.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.convenienceFee.count({ where }),
        ]);
        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((r) => ({
              id: r.id,
              feeName: r.feeName,
              productType: r.productType as ConvenienceFeeRecord['productType'],
              channel: r.channel as ConvenienceFeeRecord['channel'],
              value: Number(r.value),
              applicableTo: r.applicableTo as ConvenienceFeeRecord['applicableTo'],
              status: r.status as ConvenienceFeeRecord['status'],
              remarks: r.remarks,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // fallback
      }
    }
    let all = Array.from(this.convenienceFees.values());
    if (query?.status) all = all.filter((i) => i.status === query.status);
    if (query?.productType) all = all.filter((i) => i.productType === query.productType);
    if (query?.channel) all = all.filter((i) => i.channel === query.channel);
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter((i) => i.feeName.toLowerCase().includes(s));
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return this.pageOf(all, page, limit);
  }

  async getConvenienceFee(id: string): Promise<ConvenienceFeeRecord | null> {
    if (this.prisma) {
      try {
        const r = await this.prisma.convenienceFee.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            feeName: r.feeName,
            productType: r.productType as ConvenienceFeeRecord['productType'],
            channel: r.channel as ConvenienceFeeRecord['channel'],
            value: Number(r.value),
            applicableTo: r.applicableTo as ConvenienceFeeRecord['applicableTo'],
            status: r.status as ConvenienceFeeRecord['status'],
            remarks: r.remarks,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }
    return this.convenienceFees.get(id) ?? null;
  }

  async updateConvenienceFee(
    id: string,
    input: UpdateConvenienceFeeDto,
  ): Promise<ConvenienceFeeRecord | null> {
    const existing = await this.getConvenienceFee(id);
    if (!existing) return null;
    const updated: ConvenienceFeeRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.convenienceFees.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.convenienceFee.update({
          where: { id },
          data: {
            feeName: updated.feeName,
            productType: updated.productType,
            channel: updated.channel,
            value: new Prisma.Decimal(updated.value),
            applicableTo: updated.applicableTo,
            status: updated.status,
            remarks: updated.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return updated;
  }

  async deleteConvenienceFee(id: string): Promise<boolean> {
    const existing = await this.getConvenienceFee(id);
    if (!existing) return false;
    this.convenienceFees.delete(id);
    if (this.prisma) {
      try {
        await this.prisma.convenienceFee.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    return true;
  }

  // ── Discount Rule ──────────────────────────────────────────

  async createDiscount(input: CreateDiscountRuleDto): Promise<DiscountRuleRecord> {
    const now = new Date().toISOString();
    const record: DiscountRuleRecord = {
      id: this.id('dr'),
      ...input,
      discountType: input.discountType ?? 'PERCENTAGE',
      minBookingValue: input.minBookingValue ?? 0,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
      status: input.status ?? 'ACTIVE',
      remarks: input.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.discounts.set(record.id, record);
    if (this.prisma) {
      try {
        await this.prisma.discountRule.create({
          data: {
            id: record.id,
            name: record.name,
            productType: record.productType,
            discountType: record.discountType,
            value: new Prisma.Decimal(record.value),
            minBookingValue: new Prisma.Decimal(record.minBookingValue),
            validFrom: record.validFrom ? new Date(record.validFrom) : null,
            validTo: record.validTo ? new Date(record.validTo) : null,
            status: record.status,
            remarks: record.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return record;
  }

  async listDiscounts(query?: DiscountRuleQueryDto): Promise<ListResult<DiscountRuleRecord>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    if (this.prisma) {
      try {
        const where: Prisma.DiscountRuleWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.productType) where.productType = query.productType;
        if (query?.discountType) where.discountType = query.discountType;
        if (query?.search) where.name = { contains: query.search };
        const [rows, total] = await Promise.all([
          this.prisma.discountRule.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.discountRule.count({ where }),
        ]);
        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((r) => ({
              id: r.id,
              name: r.name,
              productType: r.productType as DiscountRuleRecord['productType'],
              discountType: r.discountType as DiscountRuleRecord['discountType'],
              value: Number(r.value),
              minBookingValue: Number(r.minBookingValue),
              validFrom: r.validFrom?.toISOString() ?? null,
              validTo: r.validTo?.toISOString() ?? null,
              status: r.status as DiscountRuleRecord['status'],
              remarks: r.remarks,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // fallback
      }
    }
    let all = Array.from(this.discounts.values());
    if (query?.status) all = all.filter((i) => i.status === query.status);
    if (query?.productType) all = all.filter((i) => i.productType === query.productType);
    if (query?.discountType) {
      all = all.filter((i) => i.discountType === query.discountType);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter((i) => i.name.toLowerCase().includes(s));
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return this.pageOf(all, page, limit);
  }

  async getDiscount(id: string): Promise<DiscountRuleRecord | null> {
    if (this.prisma) {
      try {
        const r = await this.prisma.discountRule.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            name: r.name,
            productType: r.productType as DiscountRuleRecord['productType'],
            discountType: r.discountType as DiscountRuleRecord['discountType'],
            value: Number(r.value),
            minBookingValue: Number(r.minBookingValue),
            validFrom: r.validFrom?.toISOString() ?? null,
            validTo: r.validTo?.toISOString() ?? null,
            status: r.status as DiscountRuleRecord['status'],
            remarks: r.remarks,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }
    return this.discounts.get(id) ?? null;
  }

  async updateDiscount(
    id: string,
    input: UpdateDiscountRuleDto,
  ): Promise<DiscountRuleRecord | null> {
    const existing = await this.getDiscount(id);
    if (!existing) return null;
    const updated: DiscountRuleRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.discounts.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.discountRule.update({
          where: { id },
          data: {
            name: updated.name,
            productType: updated.productType,
            discountType: updated.discountType,
            value: new Prisma.Decimal(updated.value),
            minBookingValue: new Prisma.Decimal(updated.minBookingValue),
            validFrom: updated.validFrom ? new Date(updated.validFrom) : null,
            validTo: updated.validTo ? new Date(updated.validTo) : null,
            status: updated.status,
            remarks: updated.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return updated;
  }

  async deleteDiscount(id: string): Promise<boolean> {
    const existing = await this.getDiscount(id);
    if (!existing) return false;
    this.discounts.delete(id);
    if (this.prisma) {
      try {
        await this.prisma.discountRule.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    return true;
  }

  // ── GST Rule ───────────────────────────────────────────────

  async createGst(input: CreateGstRuleDto): Promise<GstRuleRecord> {
    const now = new Date().toISOString();
    const record: GstRuleRecord = {
      id: this.id('gst'),
      ...input,
      gstType: input.gstType ?? 'GST',
      applicableFor: input.applicableFor ?? 'DOMESTIC',
      status: input.status ?? 'ACTIVE',
      remarks: input.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.gstRules.set(record.id, record);
    if (this.prisma) {
      try {
        await this.prisma.gstRule.create({
          data: {
            id: record.id,
            name: record.name,
            productType: record.productType,
            gstType: record.gstType,
            gstPercentage: new Prisma.Decimal(record.gstPercentage),
            applicableFor: record.applicableFor,
            status: record.status,
            remarks: record.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return record;
  }

  async listGst(query?: GstRuleQueryDto): Promise<ListResult<GstRuleRecord>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    if (this.prisma) {
      try {
        const where: Prisma.GstRuleWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.productType) where.productType = query.productType;
        if (query?.search) where.name = { contains: query.search };
        const [rows, total] = await Promise.all([
          this.prisma.gstRule.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.gstRule.count({ where }),
        ]);
        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((r) => ({
              id: r.id,
              name: r.name,
              productType: r.productType as GstRuleRecord['productType'],
              gstType: r.gstType as GstRuleRecord['gstType'],
              gstPercentage: Number(r.gstPercentage),
              applicableFor: r.applicableFor as GstRuleRecord['applicableFor'],
              status: r.status as GstRuleRecord['status'],
              remarks: r.remarks,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // fallback
      }
    }
    let all = Array.from(this.gstRules.values());
    if (query?.status) all = all.filter((i) => i.status === query.status);
    if (query?.productType) all = all.filter((i) => i.productType === query.productType);
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter((i) => i.name.toLowerCase().includes(s));
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return this.pageOf(all, page, limit);
  }

  async getGst(id: string): Promise<GstRuleRecord | null> {
    if (this.prisma) {
      try {
        const r = await this.prisma.gstRule.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            name: r.name,
            productType: r.productType as GstRuleRecord['productType'],
            gstType: r.gstType as GstRuleRecord['gstType'],
            gstPercentage: Number(r.gstPercentage),
            applicableFor: r.applicableFor as GstRuleRecord['applicableFor'],
            status: r.status as GstRuleRecord['status'],
            remarks: r.remarks,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }
    return this.gstRules.get(id) ?? null;
  }

  async updateGst(id: string, input: UpdateGstRuleDto): Promise<GstRuleRecord | null> {
    const existing = await this.getGst(id);
    if (!existing) return null;
    const updated: GstRuleRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.gstRules.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.gstRule.update({
          where: { id },
          data: {
            name: updated.name,
            productType: updated.productType,
            gstType: updated.gstType,
            gstPercentage: new Prisma.Decimal(updated.gstPercentage),
            applicableFor: updated.applicableFor,
            status: updated.status,
            remarks: updated.remarks,
          },
        });
      } catch {
        // fallback
      }
    }
    return updated;
  }

  async deleteGst(id: string): Promise<boolean> {
    const existing = await this.getGst(id);
    if (!existing) return false;
    this.gstRules.delete(id);
    if (this.prisma) {
      try {
        await this.prisma.gstRule.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    return true;
  }
}
