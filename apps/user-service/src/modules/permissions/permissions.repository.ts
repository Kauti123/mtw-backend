import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import { DEFAULT_PERMISSION_CATALOG } from '@mtw/contracts';
import type {
  CreatePermissionDto,
  CreatePermissionModuleDto,
  PermissionListResponse,
  PermissionMatrixResponse,
  PermissionModuleRecord,
  PermissionQueryDto,
  PermissionRecord,
  UpdatePermissionDto,
  UpdatePermissionModuleDto,
} from './dto';

@Injectable()
export class PermissionsRepository {
  private readonly moduleStore = new Map<string, PermissionModuleRecord>();
  private readonly permissionStore = new Map<string, PermissionRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seedCatalog();
  }

  private seedCatalog(): void {
    const now = new Date().toISOString();
    for (const moduleDef of DEFAULT_PERMISSION_CATALOG) {
      const moduleId = `pmod_${moduleDef.code}`;
      const permissions: PermissionRecord[] = moduleDef.permissions.map((item) => {
        const record: PermissionRecord = {
          id: `perm_${item.code.replace(/\./g, '_')}`,
          code: item.code,
          name: item.name,
          moduleId,
          moduleCode: moduleDef.code,
          moduleName: moduleDef.name,
          description: null,
          sortOrder: item.sortOrder,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        this.permissionStore.set(record.id, record);
        return record;
      });

      this.moduleStore.set(moduleId, {
        id: moduleId,
        code: moduleDef.code,
        name: moduleDef.name,
        sortOrder: moduleDef.sortOrder,
        tone: moduleDef.tone,
        status: 'ACTIVE',
        permissions,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async getMatrix(): Promise<PermissionMatrixResponse> {
    if (this.prisma) {
      try {
        const modules = await this.prisma.permissionModule.findMany({
          include: { permissions: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        });
        if (modules.length > 0) {
          return {
            modules: modules.map((module) => this.mapModuleFromPrisma(module)),
          };
        }
      } catch {
        // Fallback
      }
    }

    return {
      modules: Array.from(this.moduleStore.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    };
  }

  async findAll(query?: PermissionQueryDto): Promise<PermissionListResponse> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 50;

    if (this.prisma) {
      try {
        const where: Prisma.PermissionWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.moduleId) where.moduleId = query.moduleId;
        if (query?.moduleCode) where.module = { code: query.moduleCode };
        if (query?.search) {
          where.OR = [
            { name: { contains: query.search } },
            { code: { contains: query.search } },
          ];
        }

        const [rows, total] = await Promise.all([
          this.prisma.permission.findMany({
            where,
            include: { module: true },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
          }),
          this.prisma.permission.count({ where }),
        ]);

        if (rows.length > 0 || total === 0) {
          return {
            items: rows.map((row) => this.mapPermissionFromPrisma(row)),
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

    let items = Array.from(this.permissionStore.values());
    if (query?.status) items = items.filter((item) => item.status === query.status);
    if (query?.moduleId) {
      items = items.filter((item) => item.moduleId === query.moduleId);
    }
    if (query?.moduleCode) {
      items = items.filter((item) => item.moduleCode === query.moduleCode);
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.code.toLowerCase().includes(search),
      );
    }
    items.sort(
      (a, b) =>
        a.moduleCode.localeCompare(b.moduleCode) || a.sortOrder - b.sortOrder,
    );
    const total = items.length;
    return {
      items: items.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<PermissionRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.permission.findUnique({
          where: { id },
          include: { module: true },
        });
        if (row) return this.mapPermissionFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.permissionStore.get(id) ?? null;
  }

  async findByCode(code: string): Promise<PermissionRecord | null> {
    const normalized = code.trim().toLowerCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.permission.findUnique({
          where: { code: normalized },
          include: { module: true },
        });
        if (row) return this.mapPermissionFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return (
      Array.from(this.permissionStore.values()).find(
        (item) => item.code === normalized,
      ) ?? null
    );
  }

  async findModuleById(id: string): Promise<PermissionModuleRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.permissionModule.findUnique({
          where: { id },
          include: { permissions: { orderBy: { sortOrder: 'asc' } } },
        });
        if (row) return this.mapModuleFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.moduleStore.get(id) ?? null;
  }

  async findModuleByCode(code: string): Promise<PermissionModuleRecord | null> {
    const normalized = code.trim().toLowerCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.permissionModule.findUnique({
          where: { code: normalized },
          include: { permissions: { orderBy: { sortOrder: 'asc' } } },
        });
        if (row) return this.mapModuleFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return (
      Array.from(this.moduleStore.values()).find(
        (item) => item.code === normalized,
      ) ?? null
    );
  }

  async createModule(
    input: CreatePermissionModuleDto,
  ): Promise<PermissionModuleRecord> {
    const id = `pmod_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const now = new Date().toISOString();
    const record: PermissionModuleRecord = {
      id,
      code: input.code.toLowerCase(),
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
      tone: input.tone ?? null,
      status: input.status ?? 'ACTIVE',
      permissions: [],
      createdAt: now,
      updatedAt: now,
    };
    this.moduleStore.set(id, record);

    if (this.prisma) {
      try {
        await this.prisma.permissionModule.create({
          data: {
            id: record.id,
            code: record.code,
            name: record.name,
            sortOrder: record.sortOrder,
            tone: record.tone,
            status: record.status,
          },
        });
      } catch {
        // Fallback
      }
    }

    return record;
  }

  async updateModule(
    id: string,
    input: UpdatePermissionModuleDto,
  ): Promise<PermissionModuleRecord | null> {
    const existing = await this.findModuleById(id);
    if (!existing) return null;

    const updated: PermissionModuleRecord = {
      ...existing,
      code: input.code ? input.code.toLowerCase() : existing.code,
      name: input.name ?? existing.name,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      tone: input.tone !== undefined ? input.tone : existing.tone,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };
    this.moduleStore.set(id, updated);

    if (this.prisma) {
      try {
        await this.prisma.permissionModule.update({
          where: { id },
          data: {
            code: updated.code,
            name: updated.name,
            sortOrder: updated.sortOrder,
            tone: updated.tone,
            status: updated.status,
          },
        });
      } catch {
        // Fallback
      }
    }

    return updated;
  }

  async create(input: CreatePermissionDto): Promise<PermissionRecord> {
    const module =
      (input.moduleId ? await this.findModuleById(input.moduleId) : null) ??
      (input.moduleCode ? await this.findModuleByCode(input.moduleCode) : null);

    if (!module) {
      throw new Error('Permission module not found');
    }

    const id = `perm_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const now = new Date().toISOString();
    const record: PermissionRecord = {
      id,
      code: input.code.toLowerCase(),
      name: input.name,
      moduleId: module.id,
      moduleCode: module.code,
      moduleName: module.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.permissionStore.set(id, record);
    const moduleRecord = this.moduleStore.get(module.id);
    if (moduleRecord) {
      moduleRecord.permissions = [...moduleRecord.permissions, record].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      moduleRecord.updatedAt = now;
      this.moduleStore.set(module.id, moduleRecord);
    }

    if (this.prisma) {
      try {
        await this.prisma.permission.create({
          data: {
            id: record.id,
            code: record.code,
            name: record.name,
            moduleId: record.moduleId,
            description: record.description,
            sortOrder: record.sortOrder,
            status: record.status,
          },
        });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'permission',
          aggregateId: record.id,
          eventType: 'permission.created',
          payload: { permissionId: record.id, code: record.code },
        });
      } catch {
        // Non-blocking
      }
    }

    return record;
  }

  async update(
    id: string,
    input: UpdatePermissionDto,
  ): Promise<PermissionRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    let moduleId = existing.moduleId;
    let moduleCode = existing.moduleCode;
    let moduleName = existing.moduleName;

    if (input.moduleId || input.moduleCode) {
      const module =
        (input.moduleId ? await this.findModuleById(input.moduleId) : null) ??
        (input.moduleCode
          ? await this.findModuleByCode(input.moduleCode)
          : null);
      if (!module) throw new Error('Permission module not found');
      moduleId = module.id;
      moduleCode = module.code;
      moduleName = module.name;
    }

    const updated: PermissionRecord = {
      ...existing,
      code: input.code ? input.code.toLowerCase() : existing.code,
      name: input.name ?? existing.name,
      moduleId,
      moduleCode,
      moduleName,
      description:
        input.description !== undefined ? input.description : existing.description,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    this.permissionStore.set(id, updated);

    if (this.prisma) {
      try {
        await this.prisma.permission.update({
          where: { id },
          data: {
            code: updated.code,
            name: updated.name,
            moduleId: updated.moduleId,
            description: updated.description,
            sortOrder: updated.sortOrder,
            status: updated.status,
          },
        });
      } catch {
        // Fallback
      }
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    this.permissionStore.delete(id);
    const module = this.moduleStore.get(existing.moduleId);
    if (module) {
      module.permissions = module.permissions.filter((item) => item.id !== id);
      this.moduleStore.set(module.id, module);
    }

    if (this.prisma) {
      try {
        await this.prisma.permission.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    return true;
  }

  private mapModuleFromPrisma(row: {
    id: string;
    code: string;
    name: string;
    sortOrder: number;
    tone: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    permissions: Array<{
      id: string;
      code: string;
      name: string;
      moduleId: string;
      description: string | null;
      sortOrder: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): PermissionModuleRecord {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      sortOrder: row.sortOrder,
      tone: row.tone,
      status: row.status as PermissionModuleRecord['status'],
      permissions: row.permissions.map((permission) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        moduleId: permission.moduleId,
        moduleCode: row.code,
        moduleName: row.name,
        description: permission.description,
        sortOrder: permission.sortOrder,
        status: permission.status as PermissionRecord['status'],
        createdAt: permission.createdAt.toISOString(),
        updatedAt: permission.updatedAt.toISOString(),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapPermissionFromPrisma(row: {
    id: string;
    code: string;
    name: string;
    moduleId: string;
    description: string | null;
    sortOrder: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    module: { code: string; name: string };
  }): PermissionRecord {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      moduleId: row.moduleId,
      moduleCode: row.module.code,
      moduleName: row.module.name,
      description: row.description,
      sortOrder: row.sortOrder,
      status: row.status as PermissionRecord['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
