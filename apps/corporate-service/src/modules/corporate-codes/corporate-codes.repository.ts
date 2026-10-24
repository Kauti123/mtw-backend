import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import type {
  CorporateCodeQueryDto,
  CorporateCodeRecord,
  CreateCorporateCodeDto,
  UpdateCorporateCodeDto,
} from './dto';

@Injectable()
export class CorporateCodesRepository {
  private readonly memoryStore = new Map<string, CorporateCodeRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seedInitial();
  }

  private seedInitial(): void {
    const now = new Date().toISOString();
    const seed: CorporateCodeRecord = {
      id: 'ccode_acme_01',
      code: 'ACME001',
      name: 'Acme Corporation',
      corporateType: 'CLIENT',
      defaultCountry: 'India',
      defaultCurrency: 'INR',
      pricingModel: 'MARKUP',
      gstApplicable: true,
      status: 'ACTIVE',
      primaryContact: 'John Mathew',
      email: 'john.mathew@acmecorp.com',
      phone: '+91 9876543210',
      remarks: 'Primary corporate code for Acme travel bookings.',
      createdAt: now,
      updatedAt: now,
    };
    this.memoryStore.set(seed.id, seed);
  }

  async create(input: CreateCorporateCodeDto): Promise<CorporateCodeRecord> {
    const id = `ccode_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const record: CorporateCodeRecord = {
      id,
      code: input.code.toUpperCase(),
      name: input.name,
      corporateType: input.corporateType ?? 'CLIENT',
      defaultCountry: input.defaultCountry ?? 'India',
      defaultCurrency: input.defaultCurrency ?? 'INR',
      pricingModel: input.pricingModel ?? 'MARKUP',
      gstApplicable: input.gstApplicable ?? true,
      status: input.status ?? 'ACTIVE',
      primaryContact: input.primaryContact ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      remarks: input.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(record.id, record);

    if (this.prisma) {
      try {
        await this.prisma.corporateCode.create({
          data: {
            id: record.id,
            code: record.code,
            name: record.name,
            corporateType: record.corporateType,
            defaultCountry: record.defaultCountry,
            defaultCurrency: record.defaultCurrency,
            pricingModel: record.pricingModel,
            gstApplicable: record.gstApplicable,
            status: record.status,
            primaryContact: record.primaryContact,
            email: record.email,
            phone: record.phone,
            remarks: record.remarks,
          },
        });
      } catch {
        // Fallback to memory
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate_code',
          aggregateId: record.id,
          eventType: 'corporate_code.created',
          payload: {
            corporateCodeId: record.id,
            code: record.code,
            name: record.name,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return record;
  }

  async findAll(query?: CorporateCodeQueryDto): Promise<{
    items: CorporateCodeRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where: Prisma.CorporateCodeWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.corporateType) where.corporateType = query.corporateType;
        if (query?.pricingModel) where.pricingModel = query.pricingModel;
        if (query?.defaultCountry) where.defaultCountry = query.defaultCountry;
        if (query?.search) {
          where.OR = [
            { code: { contains: query.search } },
            { name: { contains: query.search } },
            { primaryContact: { contains: query.search } },
            { email: { contains: query.search } },
          ];
        }

        const [rows, total] = await Promise.all([
          this.prisma.corporateCode.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.corporateCode.count({ where }),
        ]);

        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((row) => this.mapFromPrisma(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // Fallback
      }
    }

    let all = Array.from(this.memoryStore.values());
    if (query?.status) all = all.filter((item) => item.status === query.status);
    if (query?.corporateType) {
      all = all.filter((item) => item.corporateType === query.corporateType);
    }
    if (query?.pricingModel) {
      all = all.filter((item) => item.pricingModel === query.pricingModel);
    }
    if (query?.defaultCountry) {
      all = all.filter(
        (item) => item.defaultCountry.toLowerCase() === query.defaultCountry?.toLowerCase(),
      );
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      all = all.filter(
        (item) =>
          item.code.toLowerCase().includes(search) ||
          item.name.toLowerCase().includes(search) ||
          (item.primaryContact ?? '').toLowerCase().includes(search) ||
          (item.email ?? '').toLowerCase().includes(search),
      );
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const total = all.length;
    return {
      items: all.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<CorporateCodeRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.corporateCode.findUnique({ where: { id } });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async findByCode(code: string): Promise<CorporateCodeRecord | null> {
    const normalized = code.trim().toUpperCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.corporateCode.findUnique({
          where: { code: normalized },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return Array.from(this.memoryStore.values()).find((item) => item.code === normalized) ?? null;
  }

  async update(id: string, input: UpdateCorporateCodeDto): Promise<CorporateCodeRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: CorporateCodeRecord = {
      ...existing,
      code: input.code ? input.code.toUpperCase() : existing.code,
      name: input.name ?? existing.name,
      corporateType: input.corporateType ?? existing.corporateType,
      defaultCountry: input.defaultCountry ?? existing.defaultCountry,
      defaultCurrency: input.defaultCurrency ?? existing.defaultCurrency,
      pricingModel: input.pricingModel ?? existing.pricingModel,
      gstApplicable:
        input.gstApplicable !== undefined ? input.gstApplicable : existing.gstApplicable,
      status: input.status ?? existing.status,
      primaryContact:
        input.primaryContact !== undefined ? input.primaryContact : existing.primaryContact,
      email: input.email !== undefined ? input.email : existing.email,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      remarks: input.remarks !== undefined ? input.remarks : existing.remarks,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      try {
        await this.prisma.corporateCode.update({
          where: { id },
          data: {
            code: updated.code,
            name: updated.name,
            corporateType: updated.corporateType,
            defaultCountry: updated.defaultCountry,
            defaultCurrency: updated.defaultCurrency,
            pricingModel: updated.pricingModel,
            gstApplicable: updated.gstApplicable,
            status: updated.status,
            primaryContact: updated.primaryContact,
            email: updated.email,
            phone: updated.phone,
            remarks: updated.remarks,
          },
        });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate_code',
          aggregateId: updated.id,
          eventType: 'corporate_code.updated',
          payload: {
            corporateCodeId: updated.id,
            code: updated.code,
            name: updated.name,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    this.memoryStore.delete(id);

    if (this.prisma) {
      try {
        await this.prisma.corporateCode.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate_code',
          aggregateId: id,
          eventType: 'corporate_code.deleted',
          payload: {
            corporateCodeId: id,
            code: existing.code,
            name: existing.name,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return true;
  }

  private mapFromPrisma(row: {
    id: string;
    code: string;
    name: string;
    corporateType: string;
    defaultCountry: string;
    defaultCurrency: string;
    pricingModel: string;
    gstApplicable: boolean;
    status: string;
    primaryContact: string | null;
    email: string | null;
    phone: string | null;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CorporateCodeRecord {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      corporateType: row.corporateType as CorporateCodeRecord['corporateType'],
      defaultCountry: row.defaultCountry,
      defaultCurrency: row.defaultCurrency,
      pricingModel: row.pricingModel as CorporateCodeRecord['pricingModel'],
      gstApplicable: row.gstApplicable,
      status: row.status as CorporateCodeRecord['status'],
      primaryContact: row.primaryContact,
      email: row.email,
      phone: row.phone,
      remarks: row.remarks,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
