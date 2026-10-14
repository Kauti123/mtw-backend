import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import type {
  CreateMarkupRuleDto,
  MarkupRuleQueryDto,
  MarkupRuleRecord,
  UpdateMarkupRuleDto,
} from './dto';

@Injectable()
export class MarkupRulesRepository {
  private readonly memoryStore = new Map<string, MarkupRuleRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seedInitial();
  }

  private seedInitial(): void {
    const now = new Date().toISOString();
    const seed: MarkupRuleRecord = {
      id: 'markup_flight_domestic_01',
      name: 'Domestic Flight Markup',
      productType: 'FLIGHT',
      markupType: 'PERCENTAGE',
      markupValue: 5,
      applicableTo: 'ALL_AGENTS',
      priority: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validTo: '2026-12-31T00:00:00.000Z',
      status: 'ACTIVE',
      conditions: [{ field: 'routeType', operator: 'EQ', value: 'DOMESTIC' }],
      remarks: 'Standard domestic flight markup for all agents.',
      corporateId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryStore.set(seed.id, seed);
  }

  async create(input: CreateMarkupRuleDto): Promise<MarkupRuleRecord> {
    const id = `markup_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const record: MarkupRuleRecord = {
      id,
      name: input.name,
      productType: input.productType,
      markupType: input.markupType ?? 'PERCENTAGE',
      markupValue: input.markupValue,
      applicableTo: input.applicableTo ?? 'ALL_AGENTS',
      priority: input.priority ?? 1,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
      status: input.status ?? 'ACTIVE',
      conditions: input.conditions ?? [],
      remarks: input.remarks ?? null,
      corporateId: input.corporateId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(record.id, record);

    if (this.prisma) {
      try {
        await this.prisma.markupRule.create({
          data: this.toPrismaData(record),
        });
      } catch {
        // Fallback
      }
    }

    await this.enqueue('markup_rule.created', record);
    return record;
  }

  async findAll(query?: MarkupRuleQueryDto): Promise<{
    items: MarkupRuleRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where: Prisma.MarkupRuleWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.productType) where.productType = query.productType;
        if (query?.markupType) where.markupType = query.markupType;
        if (query?.applicableTo) where.applicableTo = query.applicableTo;
        if (query?.corporateId) where.corporateId = query.corporateId;
        if (query?.search) {
          where.OR = [
            { name: { contains: query.search } },
            { remarks: { contains: query.search } },
          ];
        }

        const [rows, total] = await Promise.all([
          this.prisma.markupRule.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
          }),
          this.prisma.markupRule.count({ where }),
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
    if (query?.productType) {
      all = all.filter((item) => item.productType === query.productType);
    }
    if (query?.markupType) {
      all = all.filter((item) => item.markupType === query.markupType);
    }
    if (query?.applicableTo) {
      all = all.filter((item) => item.applicableTo === query.applicableTo);
    }
    if (query?.corporateId) {
      all = all.filter((item) => item.corporateId === query.corporateId);
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      all = all.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          (item.remarks ?? '').toLowerCase().includes(search),
      );
    }
    all.sort(
      (a, b) => a.priority - b.priority || b.updatedAt.localeCompare(a.updatedAt),
    );
    const total = all.length;
    return {
      items: all.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<MarkupRuleRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.markupRule.findUnique({ where: { id } });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async update(
    id: string,
    input: UpdateMarkupRuleDto,
  ): Promise<MarkupRuleRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: MarkupRuleRecord = {
      ...existing,
      name: input.name ?? existing.name,
      productType: input.productType ?? existing.productType,
      markupType: input.markupType ?? existing.markupType,
      markupValue:
        input.markupValue !== undefined ? input.markupValue : existing.markupValue,
      applicableTo: input.applicableTo ?? existing.applicableTo,
      priority: input.priority ?? existing.priority,
      validFrom:
        input.validFrom !== undefined ? input.validFrom : existing.validFrom,
      validTo: input.validTo !== undefined ? input.validTo : existing.validTo,
      status: input.status ?? existing.status,
      conditions:
        input.conditions !== undefined ? input.conditions : existing.conditions,
      remarks: input.remarks !== undefined ? input.remarks : existing.remarks,
      corporateId:
        input.corporateId !== undefined ? input.corporateId : existing.corporateId,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      try {
        await this.prisma.markupRule.update({
          where: { id },
          data: this.toPrismaData(updated),
        });
      } catch {
        // Fallback
      }
    }

    await this.enqueue('markup_rule.updated', updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    this.memoryStore.delete(id);

    if (this.prisma) {
      try {
        await this.prisma.markupRule.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    await this.enqueue('markup_rule.deleted', existing);
    return true;
  }

  private toPrismaData(record: MarkupRuleRecord): Prisma.MarkupRuleCreateInput {
    return {
      id: record.id,
      name: record.name,
      productType: record.productType,
      markupType: record.markupType,
      markupValue: new Prisma.Decimal(record.markupValue),
      applicableTo: record.applicableTo,
      priority: record.priority,
      validFrom: record.validFrom ? new Date(record.validFrom) : null,
      validTo: record.validTo ? new Date(record.validTo) : null,
      status: record.status,
      conditions: record.conditions as unknown as Prisma.InputJsonValue,
      remarks: record.remarks,
      corporateId: record.corporateId,
    };
  }

  private mapFromPrisma(row: {
    id: string;
    name: string;
    productType: string;
    markupType: string;
    markupValue: Prisma.Decimal | number;
    applicableTo: string;
    priority: number;
    validFrom: Date | null;
    validTo: Date | null;
    status: string;
    conditions: Prisma.JsonValue | null;
    remarks: string | null;
    corporateId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): MarkupRuleRecord {
    return {
      id: row.id,
      name: row.name,
      productType: row.productType as MarkupRuleRecord['productType'],
      markupType: row.markupType as MarkupRuleRecord['markupType'],
      markupValue: Number(row.markupValue),
      applicableTo: row.applicableTo as MarkupRuleRecord['applicableTo'],
      priority: row.priority,
      validFrom: row.validFrom ? row.validFrom.toISOString() : null,
      validTo: row.validTo ? row.validTo.toISOString() : null,
      status: row.status as MarkupRuleRecord['status'],
      conditions: Array.isArray(row.conditions)
        ? (row.conditions as MarkupRuleRecord['conditions'])
        : [],
      remarks: row.remarks,
      corporateId: row.corporateId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async enqueue(
    eventType: string,
    record: MarkupRuleRecord,
  ): Promise<void> {
    if (!this.outbox) return;
    try {
      await this.outbox.enqueue({
        aggregateType: 'markup_rule',
        aggregateId: record.id,
        eventType,
        payload: {
          markupRuleId: record.id,
          name: record.name,
          productType: record.productType,
          status: record.status,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
