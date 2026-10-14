import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@mtw/database';
import type {
  CreateOrgMasterDto,
  OrgMasterKind,
  OrgMasterListResponse,
  OrgMasterQueryDto,
  OrgMasterRecord,
  UpdateOrgMasterDto,
} from './dto';

type CorporateRef = { id: string; code: string; name: string };

function toCode(name: string, prefix: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 56);
  return base || `${prefix}_${Date.now()}`;
}

function idPrefix(kind: OrgMasterKind): string {
  if (kind === 'department') return 'dept';
  if (kind === 'position') return 'pos';
  return 'cc';
}

@Injectable()
export class OrgMastersRepository {
  private readonly memoryStore = new Map<string, OrgMasterRecord>();
  private readonly memoryCorporates = new Map<string, CorporateRef>();

  constructor(@Optional() private readonly prisma?: PrismaService) {
    this.seedInitial();
  }

  private seedInitial(): void {
    const now = new Date().toISOString();
    const corporates: CorporateRef[] = [
      { id: 'corp_acme_01', code: 'ACME', name: 'Acme Travels Pvt Ltd' },
      { id: 'corp_nstr_01', code: 'NSTR', name: 'Northstar Consulting' },
      { id: 'corp_orbt_01', code: 'ORBT', name: 'Orbit Logistics' },
    ];
    for (const corporate of corporates) {
      this.memoryCorporates.set(corporate.id, corporate);
      this.memoryCorporates.set(corporate.code, corporate);
    }

    const seeds: Array<Omit<OrgMasterRecord, 'createdAt' | 'updatedAt'>> = [
      { id: 'dept_eng', kind: 'department', corporateId: 'corp_acme_01', name: 'Engineering', code: 'ENGINEERING' },
      { id: 'dept_fin', kind: 'department', corporateId: 'corp_acme_01', name: 'Finance', code: 'FINANCE' },
      { id: 'dept_hr', kind: 'department', corporateId: 'corp_acme_01', name: 'Human Resources', code: 'HUMAN_RESOURCES' },
      { id: 'dept_ops', kind: 'department', corporateId: 'corp_acme_01', name: 'Operations', code: 'OPERATIONS' },
      { id: 'dept_sales', kind: 'department', corporateId: 'corp_acme_01', name: 'Sales', code: 'SALES' },
      { id: 'pos_se', kind: 'position', corporateId: 'corp_acme_01', name: 'Software Engineer', code: 'SOFTWARE_ENGINEER', hierarchy: '3' },
      { id: 'pos_sm', kind: 'position', corporateId: 'corp_acme_01', name: 'Senior Manager', code: 'SENIOR_MANAGER', hierarchy: '5' },
      { id: 'pos_tc', kind: 'position', corporateId: 'corp_acme_01', name: 'Travel Coordinator', code: 'TRAVEL_COORDINATOR', hierarchy: '2' },
      { id: 'pos_fa', kind: 'position', corporateId: 'corp_acme_01', name: 'Finance Analyst', code: 'FINANCE_ANALYST', hierarchy: '3' },
      { id: 'cc_ho', kind: 'cost-center', corporateId: 'corp_acme_01', name: 'CC-1001 · Head Office', code: 'CC_1001_HEAD_OFFICE' },
      { id: 'cc_eng', kind: 'cost-center', corporateId: 'corp_acme_01', name: 'CC-1002 · Engineering', code: 'CC_1002_ENGINEERING' },
      { id: 'cc_sales', kind: 'cost-center', corporateId: 'corp_acme_01', name: 'CC-1003 · Sales & Marketing', code: 'CC_1003_SALES_MARKETING' },
      { id: 'cc_ops', kind: 'cost-center', corporateId: 'corp_acme_01', name: 'CC-1004 · Operations', code: 'CC_1004_OPERATIONS' },
      { id: 'cc_travel', kind: 'cost-center', corporateId: 'corp_acme_01', name: 'CC-1005 · Travel Desk', code: 'CC_1005_TRAVEL_DESK' },
    ];

    for (const seed of seeds) {
      this.memoryStore.set(seed.id, { ...seed, createdAt: now, updatedAt: now });
    }
  }

  async resolveCorporate(input: {
    corporateId?: string | null;
    corporateCode?: string | null;
  }): Promise<CorporateRef | null> {
    const byId = input.corporateId?.trim();
    const byCode = input.corporateCode?.trim().toUpperCase();

    if (this.prisma) {
      try {
        if (byId) {
          const row = await this.prisma.corporate.findUnique({ where: { id: byId } });
          if (row) return { id: row.id, code: row.code, name: row.legalName };
          // Login/session sometimes stores corporate code in corporateId.
          const asCode = await this.prisma.corporate.findUnique({
            where: { code: byId.toUpperCase() },
          });
          if (asCode) return { id: asCode.id, code: asCode.code, name: asCode.legalName };
        }
        if (byCode) {
          const row = await this.prisma.corporate.findUnique({ where: { code: byCode } });
          if (row) return { id: row.id, code: row.code, name: row.legalName };
        }
      } catch {
        // fall through to memory
      }
    }

    if (byId && this.memoryCorporates.has(byId)) {
      return this.memoryCorporates.get(byId) ?? null;
    }
    if (byCode && this.memoryCorporates.has(byCode)) {
      return this.memoryCorporates.get(byCode) ?? null;
    }
    return null;
  }

  async findById(kind: OrgMasterKind, id: string): Promise<OrgMasterRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.readPrismaById(kind, id);
        if (row) return row;
      } catch {
        // memory
      }
    }
    const mem = this.memoryStore.get(id);
    return mem?.kind === kind ? mem : null;
  }

  async findByCode(
    kind: OrgMasterKind,
    corporateId: string,
    code: string,
  ): Promise<OrgMasterRecord | null> {
    const normalized = code.trim().toUpperCase();
    if (this.prisma) {
      try {
        const row = await this.readPrismaByCode(kind, corporateId, normalized);
        if (row) return row;
      } catch {
        // memory
      }
    }
    for (const item of this.memoryStore.values()) {
      if (
        item.kind === kind &&
        item.corporateId === corporateId &&
        item.code === normalized
      ) {
        return item;
      }
    }
    return null;
  }

  async findByName(
    kind: OrgMasterKind,
    corporateId: string,
    name: string,
  ): Promise<OrgMasterRecord | null> {
    const normalized = name.trim().toLowerCase();
    if (this.prisma) {
      try {
        const items = await this.listPrisma(kind, { corporateId, page: 1, limit: 200 });
        const hit = items.items.find((item) => item.name.trim().toLowerCase() === normalized);
        if (hit) return hit;
      } catch {
        // memory
      }
    }
    for (const item of this.memoryStore.values()) {
      if (
        item.kind === kind &&
        item.corporateId === corporateId &&
        item.name.trim().toLowerCase() === normalized
      ) {
        return item;
      }
    }
    return null;
  }

  async findAll(
    kind: OrgMasterKind,
    query: OrgMasterQueryDto,
  ): Promise<OrgMasterListResponse> {
    if (this.prisma) {
      try {
        const fromDb = await this.listPrisma(kind, query);
        if (fromDb.total > 0 || query.corporateId || query.corporateCode) {
          return fromDb;
        }
      } catch {
        // memory
      }
    }

    let items = Array.from(this.memoryStore.values()).filter((item) => item.kind === kind);
    if (query.corporateId) {
      items = items.filter((item) => item.corporateId === query.corporateId);
    }
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async create(
    kind: OrgMasterKind,
    input: CreateOrgMasterDto & { corporateId: string },
  ): Promise<OrgMasterRecord> {
    const now = new Date().toISOString();
    const code = (input.code?.trim() || toCode(input.name, idPrefix(kind))).toUpperCase();
    const id = `${idPrefix(kind)}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const record: OrgMasterRecord = {
      id,
      kind,
      corporateId: input.corporateId,
      name: input.name.trim(),
      code,
      hierarchy: kind === 'position' ? input.hierarchy?.trim() || null : null,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(record.id, record);

    if (this.prisma) {
      try {
        await this.createPrisma(kind, record);
      } catch {
        // keep memory
      }
    }

    return record;
  }

  async update(
    kind: OrgMasterKind,
    id: string,
    input: UpdateOrgMasterDto,
  ): Promise<OrgMasterRecord | null> {
    const existing = await this.findById(kind, id);
    if (!existing) return null;

    const next: OrgMasterRecord = {
      ...existing,
      name: input.name?.trim() || existing.name,
      code: input.code?.trim().toUpperCase() || existing.code,
      hierarchy:
        kind === 'position'
          ? input.hierarchy !== undefined
            ? input.hierarchy?.trim() || null
            : existing.hierarchy ?? null
          : null,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(next.id, next);

    if (this.prisma) {
      try {
        await this.updatePrisma(kind, next);
      } catch {
        // keep memory
      }
    }

    return next;
  }

  async remove(kind: OrgMasterKind, id: string): Promise<boolean> {
    const existing = await this.findById(kind, id);
    if (!existing) return false;

    this.memoryStore.delete(id);

    if (this.prisma) {
      try {
        await this.deletePrisma(kind, id);
      } catch {
        // memory already cleared
      }
    }

    return true;
  }

  private async listPrisma(
    kind: OrgMasterKind,
    query: OrgMasterQueryDto,
  ): Promise<OrgMasterListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Record<string, unknown> = {};
    if (query.corporateId) where['corporateId'] = query.corporateId;
    if (query.search?.trim()) {
      where['OR'] = [
        { name: { contains: query.search.trim() } },
        { code: { contains: query.search.trim() } },
      ];
    }

    if (kind === 'department') {
      const [total, rows] = await Promise.all([
        this.prisma!.department.count({ where }),
        this.prisma!.department.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);
      const now = new Date().toISOString();
      return {
        items: rows.map((row) => ({
          id: row.id,
          kind,
          corporateId: row.corporateId,
          name: row.name,
          code: row.code,
          hierarchy: null,
          createdAt: now,
          updatedAt: now,
        })),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
      };
    }

    if (kind === 'position') {
      const [total, rows] = await Promise.all([
        this.prisma!.position.count({ where }),
        this.prisma!.position.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);
      return {
        items: rows.map((row) => ({
          id: row.id,
          kind,
          corporateId: row.corporateId,
          name: row.name,
          code: row.code,
          hierarchy: row.hierarchy ?? null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma!.costCenter.count({ where }),
      this.prisma!.costCenter.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    const now = new Date().toISOString();
    return {
      items: rows.map((row) => ({
        id: row.id,
        kind,
        corporateId: row.corporateId,
        name: row.name,
        code: row.code,
        hierarchy: null,
        createdAt: now,
        updatedAt: now,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    };
  }

  private async readPrismaById(
    kind: OrgMasterKind,
    id: string,
  ): Promise<OrgMasterRecord | null> {
    const now = new Date().toISOString();
    if (kind === 'department') {
      const row = await this.prisma!.department.findUnique({ where: { id } });
      if (!row) return null;
      return {
        id: row.id,
        kind,
        corporateId: row.corporateId,
        name: row.name,
        code: row.code,
        hierarchy: null,
        createdAt: now,
        updatedAt: now,
      };
    }
    if (kind === 'position') {
      const row = await this.prisma!.position.findUnique({ where: { id } });
      if (!row) return null;
      return {
        id: row.id,
        kind,
        corporateId: row.corporateId,
        name: row.name,
        code: row.code,
        hierarchy: row.hierarchy ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
    const row = await this.prisma!.costCenter.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      kind,
      corporateId: row.corporateId,
      name: row.name,
      code: row.code,
      hierarchy: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async readPrismaByCode(
    kind: OrgMasterKind,
    corporateId: string,
    code: string,
  ): Promise<OrgMasterRecord | null> {
    const now = new Date().toISOString();
    if (kind === 'department') {
      const row = await this.prisma!.department.findUnique({
        where: { corporateId_code: { corporateId, code } },
      });
      if (!row) return null;
      return {
        id: row.id,
        kind,
        corporateId: row.corporateId,
        name: row.name,
        code: row.code,
        hierarchy: null,
        createdAt: now,
        updatedAt: now,
      };
    }
    if (kind === 'position') {
      const row = await this.prisma!.position.findUnique({
        where: { corporateId_code: { corporateId, code } },
      });
      if (!row) return null;
      return {
        id: row.id,
        kind,
        corporateId: row.corporateId,
        name: row.name,
        code: row.code,
        hierarchy: row.hierarchy ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
    const row = await this.prisma!.costCenter.findUnique({
      where: { corporateId_code: { corporateId, code } },
    });
    if (!row) return null;
    return {
      id: row.id,
      kind,
      corporateId: row.corporateId,
      name: row.name,
      code: row.code,
      hierarchy: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async createPrisma(kind: OrgMasterKind, record: OrgMasterRecord) {
    if (kind === 'department') {
      await this.prisma!.department.create({
        data: {
          id: record.id,
          corporateId: record.corporateId,
          name: record.name,
          code: record.code,
        },
      });
      return;
    }
    if (kind === 'position') {
      await this.prisma!.position.create({
        data: {
          id: record.id,
          corporateId: record.corporateId,
          name: record.name,
          code: record.code,
          hierarchy: record.hierarchy ?? null,
        },
      });
      return;
    }
    await this.prisma!.costCenter.create({
      data: {
        id: record.id,
        corporateId: record.corporateId,
        name: record.name,
        code: record.code,
      },
    });
  }

  private async updatePrisma(kind: OrgMasterKind, record: OrgMasterRecord) {
    if (kind === 'department') {
      await this.prisma!.department.update({
        where: { id: record.id },
        data: { name: record.name, code: record.code },
      });
      return;
    }
    if (kind === 'position') {
      await this.prisma!.position.update({
        where: { id: record.id },
        data: {
          name: record.name,
          code: record.code,
          hierarchy: record.hierarchy ?? null,
        },
      });
      return;
    }
    await this.prisma!.costCenter.update({
      where: { id: record.id },
      data: { name: record.name, code: record.code },
    });
  }

  private async deletePrisma(kind: OrgMasterKind, id: string) {
    if (kind === 'department') {
      await this.prisma!.department.delete({ where: { id } });
      return;
    }
    if (kind === 'position') {
      await this.prisma!.position.delete({ where: { id } });
      return;
    }
    await this.prisma!.costCenter.delete({ where: { id } });
  }
}
