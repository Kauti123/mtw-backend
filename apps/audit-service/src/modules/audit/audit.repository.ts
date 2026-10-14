import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@mtw/database';
import type {
  AuditLogQueryDto,
  AuditLogRecord,
  AuditLogSummary,
  CreateAuditLogDto,
} from './dto';

@Injectable()
export class AuditRepository {
  private readonly memoryStore = new Map<string, AuditLogRecord>();
  private seeded = false;

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  private ensureSeed(): void {
    if (this.seeded) return;
    this.seeded = true;
    const now = Date.now();
    const seeds: CreateAuditLogDto[] = [
      {
        actorId: 'admin_super_01',
        actorType: 'ADMIN_USER',
        actorName: 'Misba Admin',
        actorEmail: 'admin@misba.com',
        action: 'LOGIN',
        resourceType: 'ADMIN_SESSION',
        resourceId: 'session_seed_01',
        targetLabel: 'Admin Portal',
        result: 'SUCCESS',
        beforeJson: null,
        afterJson: null,
        metadata: { portal: 'supervision' },
        ip: '203.0.113.45',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0.0.0',
        corporateId: null,
        correlationId: `corr_seed_${randomUUID().slice(0, 8)}`,
      },
      {
        actorId: 'admin_super_01',
        actorType: 'ADMIN_USER',
        actorName: 'Misba Admin',
        actorEmail: 'admin@misba.com',
        action: 'CREATED',
        resourceType: 'ROLE',
        resourceId: 'role_booking_manager_01',
        targetLabel: 'Booking Manager',
        result: 'SUCCESS',
        beforeJson: null,
        afterJson: { code: 'BOOKING_MANAGER', status: 'ACTIVE' },
        metadata: null,
        ip: '203.0.113.45',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0.0.0',
        corporateId: null,
        correlationId: `corr_seed_${randomUUID().slice(0, 8)}`,
      },
      {
        actorId: 'unknown',
        actorType: 'ADMIN_USER',
        actorName: 'Unknown',
        actorEmail: 'attacker@example.com',
        action: 'LOGIN_FAILED',
        resourceType: 'ADMIN_SESSION',
        resourceId: null,
        targetLabel: 'Admin Portal',
        result: 'DENIED',
        beforeJson: null,
        afterJson: null,
        metadata: { reason: 'Invalid credentials' },
        ip: '198.51.100.22',
        userAgent: 'curl/8.0.0',
        corporateId: null,
        correlationId: `corr_seed_${randomUUID().slice(0, 8)}`,
      },
    ];

    seeds.forEach((seed, index) => {
      const createdAt = new Date(now - index * 3_600_000).toISOString();
      const id = `audit_seed_${index + 1}`;
      this.memoryStore.set(id, this.toRecord(id, seed, createdAt));
    });
  }

  async create(input: CreateAuditLogDto): Promise<AuditLogRecord> {
    this.ensureSeed();
    const id = `audit_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const createdAt = new Date().toISOString();
    const correlationId =
      input.correlationId?.trim() || `corr_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const payload: CreateAuditLogDto = { ...input, correlationId };
    const record = this.toRecord(id, payload, createdAt);
    this.memoryStore.set(id, record);

    if (this.prisma) {
      try {
        await this.prisma.auditLog.create({
          data: {
            id,
            corporateId: payload.corporateId ?? null,
            actorId: payload.actorId ?? null,
            actorType: payload.actorType ?? null,
            actorName: payload.actorName ?? null,
            actorEmail: payload.actorEmail ?? null,
            action: payload.action,
            resourceType: payload.resourceType,
            resourceId: payload.resourceId ?? null,
            targetLabel: payload.targetLabel ?? null,
            result: payload.result ?? 'SUCCESS',
            beforeJson: (payload.beforeJson ?? undefined) as Prisma.InputJsonValue | undefined,
            afterJson: (payload.afterJson ?? undefined) as Prisma.InputJsonValue | undefined,
            metadata: (payload.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
            ip: payload.ip ?? null,
            userAgent: payload.userAgent ?? null,
            correlationId,
            createdAt: new Date(createdAt),
          },
        });
      } catch {
        // memory fallback
      }
    }

    return record;
  }

  async findAll(query?: AuditLogQueryDto): Promise<{
    items: AuditLogRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.ensureSeed();
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where = this.buildWhere(query);
        const [rows, total] = await Promise.all([
          this.prisma.auditLog.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.auditLog.count({ where }),
        ]);
        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((r) => this.mapFromPrisma(r)),
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

    let all = Array.from(this.memoryStore.values());
    all = this.filterMemory(all, query);
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = all.length;
    return {
      items: all.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<AuditLogRecord | null> {
    this.ensureSeed();
    if (this.prisma) {
      try {
        const row = await this.prisma.auditLog.findUnique({ where: { id } });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async summary(): Promise<AuditLogSummary> {
    this.ensureSeed();
    const since = new Date(Date.now() - 24 * 60 * 60_000);

    if (this.prisma) {
      try {
        const [total, success, denied, failed, last24Hours] = await Promise.all([
          this.prisma.auditLog.count(),
          this.prisma.auditLog.count({ where: { result: 'SUCCESS' } }),
          this.prisma.auditLog.count({ where: { result: 'DENIED' } }),
          this.prisma.auditLog.count({ where: { result: 'FAILED' } }),
          this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
        ]);
        if (total > 0) {
          return { total, success, denied, failed, last24Hours };
        }
      } catch {
        // fallback
      }
    }

    const all = Array.from(this.memoryStore.values());
    return {
      total: all.length,
      success: all.filter((i) => i.result === 'SUCCESS').length,
      denied: all.filter((i) => i.result === 'DENIED').length,
      failed: all.filter((i) => i.result === 'FAILED').length,
      last24Hours: all.filter((i) => new Date(i.createdAt) >= since).length,
    };
  }

  private buildWhere(query?: AuditLogQueryDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (!query) return where;

    if (query.actorId) where.actorId = query.actorId;
    if (query.actorName) where.actorName = { contains: query.actorName };
    if (query.actorEmail) where.actorEmail = query.actorEmail.toLowerCase();
    if (query.actorType) where.actorType = query.actorType;
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.corporateId) where.corporateId = query.corporateId;
    if (query.result) where.result = query.result;
    if (query.correlationId) where.correlationId = query.correlationId;
    if (query.ip) where.ip = query.ip;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.search) {
      where.OR = [
        { actorName: { contains: query.search } },
        { actorEmail: { contains: query.search } },
        { action: { contains: query.search } },
        { resourceType: { contains: query.search } },
        { resourceId: { contains: query.search } },
        { targetLabel: { contains: query.search } },
        { ip: { contains: query.search } },
        { correlationId: { contains: query.search } },
      ];
    }
    return where;
  }

  private filterMemory(
    all: AuditLogRecord[],
    query?: AuditLogQueryDto,
  ): AuditLogRecord[] {
    if (!query) return all;
    let items = all;
    if (query.actorId) items = items.filter((i) => i.actorId === query.actorId);
    if (query.actorName) {
      const s = query.actorName.toLowerCase();
      items = items.filter((i) => i.actorName?.toLowerCase().includes(s));
    }
    if (query.actorEmail) {
      items = items.filter(
        (i) => i.actorEmail === query.actorEmail?.toLowerCase(),
      );
    }
    if (query.actorType) items = items.filter((i) => i.actorType === query.actorType);
    if (query.action) items = items.filter((i) => i.action === query.action);
    if (query.resourceType) {
      items = items.filter((i) => i.resourceType === query.resourceType);
    }
    if (query.resourceId) {
      items = items.filter((i) => i.resourceId === query.resourceId);
    }
    if (query.corporateId) {
      items = items.filter((i) => i.corporateId === query.corporateId);
    }
    if (query.result) items = items.filter((i) => i.result === query.result);
    if (query.correlationId) {
      items = items.filter((i) => i.correlationId === query.correlationId);
    }
    if (query.ip) items = items.filter((i) => i.ip === query.ip);
    if (query.from) {
      const from = new Date(query.from).getTime();
      items = items.filter((i) => new Date(i.createdAt).getTime() >= from);
    }
    if (query.to) {
      const to = new Date(query.to).getTime();
      items = items.filter((i) => new Date(i.createdAt).getTime() <= to);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.actorName?.toLowerCase().includes(s) ||
          i.actorEmail?.toLowerCase().includes(s) ||
          i.action.toLowerCase().includes(s) ||
          i.resourceType.toLowerCase().includes(s) ||
          i.resourceId?.toLowerCase().includes(s) ||
          i.targetLabel?.toLowerCase().includes(s) ||
          i.ip?.toLowerCase().includes(s) ||
          i.correlationId.toLowerCase().includes(s),
      );
    }
    return items;
  }

  private toRecord(
    id: string,
    input: CreateAuditLogDto,
    createdAt: string,
  ): AuditLogRecord {
    const actorName = input.actorName ?? input.actorEmail ?? 'System';
    const target =
      input.targetLabel ??
      (input.resourceId
        ? `${input.resourceType}:${input.resourceId}`
        : input.resourceType);
    return {
      id,
      corporateId: input.corporateId ?? null,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? null,
      actorName: input.actorName ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      targetLabel: input.targetLabel ?? null,
      result: input.result ?? 'SUCCESS',
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      metadata: input.metadata ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      correlationId: input.correlationId ?? `corr_${id}`,
      createdAt,
      when: createdAt,
      actor: actorName,
      target,
    };
  }

  private mapFromPrisma(row: {
    id: string;
    corporateId: string | null;
    actorId: string | null;
    actorType: string | null;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    targetLabel: string | null;
    result: string;
    beforeJson: unknown;
    afterJson: unknown;
    metadata: unknown;
    ip: string | null;
    userAgent: string | null;
    correlationId: string;
    createdAt: Date;
  }): AuditLogRecord {
    const createdAt = row.createdAt.toISOString();
    const actorName = row.actorName ?? row.actorEmail ?? 'System';
    const target =
      row.targetLabel ??
      (row.resourceId
        ? `${row.resourceType}:${row.resourceId}`
        : row.resourceType);
    return {
      id: row.id,
      corporateId: row.corporateId,
      actorId: row.actorId,
      actorType: row.actorType as AuditLogRecord['actorType'],
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      targetLabel: row.targetLabel,
      result: row.result as AuditLogRecord['result'],
      beforeJson: row.beforeJson ?? null,
      afterJson: row.afterJson ?? null,
      metadata: row.metadata ?? null,
      ip: row.ip,
      userAgent: row.userAgent,
      correlationId: row.correlationId,
      createdAt,
      when: createdAt,
      actor: actorName,
      target,
    };
  }
}
