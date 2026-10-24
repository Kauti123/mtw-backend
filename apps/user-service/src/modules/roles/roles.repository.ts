import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import { normalizeRolePermissionInput, permissionsToGrants } from '@mtw/contracts';
import type {
  CreateRoleDto,
  RolePermissionDto,
  RoleQueryDto,
  RoleRecord,
  UpdateRoleDto,
} from './dto';

@Injectable()
export class RolesRepository {
  private readonly memoryStore = new Map<string, RoleRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seedInitialRole();
  }

  private seedInitialRole(): void {
    const now = new Date().toISOString();
    const permissions: RolePermissionDto[] = [
      {
        permissionCode: 'dashboard.view',
        view: true,
        create: false,
        edit: false,
        delete: false,
      },
      {
        permissionCode: 'bookings.view',
        view: true,
        create: false,
        edit: false,
        delete: false,
      },
      {
        permissionCode: 'bookings.create',
        view: false,
        create: true,
        edit: false,
        delete: false,
      },
      {
        permissionCode: 'bookings.edit',
        view: false,
        create: false,
        edit: true,
        delete: false,
      },
      {
        permissionCode: 'bookings.cancel',
        view: false,
        create: false,
        edit: false,
        delete: true,
      },
    ];
    const seed: RoleRecord = {
      id: 'role_booking_manager_01',
      name: 'Booking Manager',
      code: 'BOOKING_MANAGER',
      description: 'Manages bookings, ticketing operations and related processes.',
      roleType: 'INTERNAL',
      dataScope: 'GLOBAL',
      status: 'ACTIVE',
      makerCheckerRequired: false,
      corporateId: null,
      permissions,
      grants: permissionsToGrants(permissions),
      createdAt: now,
      updatedAt: now,
    };
    this.memoryStore.set(seed.id, seed);
  }

  private async resolvePermissionIds(
    permissions: RolePermissionDto[],
  ): Promise<Array<RolePermissionDto & { permissionId: string }>> {
    if (!this.prisma || permissions.length === 0) {
      return permissions.map((permission) => ({
        ...permission,
        permissionId: permission.permissionId ?? `perm_${permission.permissionCode}`,
      }));
    }

    const codes = permissions.map((permission) => permission.permissionCode);
    const rows = await this.prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });
    const byCode = new Map(rows.map((row) => [row.code, row.id]));

    return permissions.map((permission) => {
      const permissionId = byCode.get(permission.permissionCode);
      if (!permissionId) {
        throw new Error(
          `Unknown permission code '${permission.permissionCode}'. Seed or create it first.`,
        );
      }
      return { ...permission, permissionId };
    });
  }

  async create(input: CreateRoleDto): Promise<RoleRecord> {
    const id = `role_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const permissions = normalizeRolePermissionInput(input);

    const record: RoleRecord = {
      id,
      name: input.name,
      code: input.code.toUpperCase(),
      description: input.description ?? '',
      roleType: input.roleType,
      dataScope: input.dataScope,
      status: input.status ?? 'ACTIVE',
      makerCheckerRequired: input.makerCheckerRequired ?? false,
      corporateId: input.corporateId ?? null,
      permissions,
      grants: permissionsToGrants(permissions),
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(record.id, record);

    if (this.prisma) {
      try {
        const resolved = await this.resolvePermissionIds(permissions);
        await this.prisma.role.create({
          data: {
            id: record.id,
            code: record.code,
            name: record.name,
            description: record.description || null,
            roleType: record.roleType,
            dataScope: record.dataScope,
            status: record.status,
            makerCheckerRequired: record.makerCheckerRequired,
            corporateId: record.corporateId,
            permissions: {
              create: resolved.map((permission) => ({
                id: `rp_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
                permissionId: permission.permissionId,
                canView: permission.view,
                canCreate: permission.create,
                canEdit: permission.edit,
                canDelete: permission.delete,
              })),
            },
          },
        });
      } catch {
        // Fallback safely to memory store
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'role',
          aggregateId: record.id,
          eventType: 'role.created',
          payload: {
            roleId: record.id,
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

  async findAll(query?: RoleQueryDto): Promise<{
    items: RoleRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where: Prisma.RoleWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.roleType) where.roleType = query.roleType;
        if (query?.dataScope) where.dataScope = query.dataScope;
        if (query?.search) {
          where.OR = [
            { name: { contains: query.search } },
            { code: { contains: query.search } },
            { description: { contains: query.search } },
          ];
        }

        const [dbRows, total] = await Promise.all([
          this.prisma.role.findMany({
            where,
            include: {
              permissions: { include: { permission: true } },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.role.count({ where }),
        ]);

        if (dbRows && dbRows.length > 0) {
          return {
            items: dbRows.map((row) => this.mapFromPrisma(row)),
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
    if (query?.status) all = all.filter((role) => role.status === query.status);
    if (query?.roleType) all = all.filter((role) => role.roleType === query.roleType);
    if (query?.dataScope) all = all.filter((role) => role.dataScope === query.dataScope);
    if (query?.search) {
      const search = query.search.toLowerCase();
      all = all.filter(
        (role) =>
          role.name.toLowerCase().includes(search) ||
          role.code.toLowerCase().includes(search) ||
          role.description.toLowerCase().includes(search),
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

  async findById(id: string): Promise<RoleRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.role.findUnique({
          where: { id },
          include: {
            permissions: { include: { permission: true } },
          },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async findByCode(code: string): Promise<RoleRecord | null> {
    const normalized = code.trim().toUpperCase();

    if (this.prisma) {
      try {
        const row = await this.prisma.role.findUnique({
          where: { code: normalized },
          include: {
            permissions: { include: { permission: true } },
          },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }

    return Array.from(this.memoryStore.values()).find((role) => role.code === normalized) ?? null;
  }

  async update(id: string, input: UpdateRoleDto): Promise<RoleRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const permissions =
      input.grants || input.permissions
        ? normalizeRolePermissionInput({
            permissions: input.permissions,
            grants: input.grants,
          })
        : existing.permissions;

    const updated: RoleRecord = {
      ...existing,
      name: input.name ?? existing.name,
      code: input.code ? input.code.toUpperCase() : existing.code,
      description: input.description !== undefined ? input.description : existing.description,
      roleType: input.roleType ?? existing.roleType,
      dataScope: input.dataScope ?? existing.dataScope,
      status: input.status ?? existing.status,
      makerCheckerRequired:
        input.makerCheckerRequired !== undefined
          ? input.makerCheckerRequired
          : existing.makerCheckerRequired,
      corporateId: input.corporateId !== undefined ? input.corporateId : existing.corporateId,
      permissions,
      grants: permissionsToGrants(permissions),
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      try {
        const resolved = await this.resolvePermissionIds(permissions);
        await this.prisma.$transaction(async (tx) => {
          await tx.rolePermission.deleteMany({ where: { roleId: id } });
          await tx.role.update({
            where: { id },
            data: {
              name: updated.name,
              code: updated.code,
              description: updated.description || null,
              roleType: updated.roleType,
              dataScope: updated.dataScope,
              status: updated.status,
              makerCheckerRequired: updated.makerCheckerRequired,
              corporateId: updated.corporateId,
              permissions: {
                create: resolved.map((permission) => ({
                  id: `rp_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
                  permissionId: permission.permissionId,
                  canView: permission.view,
                  canCreate: permission.create,
                  canEdit: permission.edit,
                  canDelete: permission.delete,
                })),
              },
            },
          });
        });
      } catch {
        // Fallback safely to memory store
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'role',
          aggregateId: updated.id,
          eventType: 'role.updated',
          payload: {
            roleId: updated.id,
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

  async updateStatus(id: string, status: RoleRecord['status']): Promise<RoleRecord | null> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    this.memoryStore.delete(id);

    if (this.prisma) {
      try {
        await this.prisma.role.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'role',
          aggregateId: id,
          eventType: 'role.deleted',
          payload: {
            roleId: id,
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
    description: string | null;
    roleType: RoleRecord['roleType'];
    dataScope: RoleRecord['dataScope'];
    status: RoleRecord['status'];
    makerCheckerRequired: boolean;
    corporateId: string | null;
    createdAt: Date;
    updatedAt: Date;
    permissions?: Array<{
      permissionId: string;
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      permission: { code: string };
    }>;
  }): RoleRecord {
    const permissions: RolePermissionDto[] = (row.permissions ?? []).map((grant) => ({
      permissionId: grant.permissionId,
      permissionCode: grant.permission.code,
      view: grant.canView,
      create: grant.canCreate,
      edit: grant.canEdit,
      delete: grant.canDelete,
    }));

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? '',
      roleType: row.roleType,
      dataScope: row.dataScope,
      status: row.status,
      makerCheckerRequired: row.makerCheckerRequired,
      corporateId: row.corporateId,
      permissions,
      grants: permissionsToGrants(permissions),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
