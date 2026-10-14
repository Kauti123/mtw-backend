import { Injectable, Optional } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Prisma, UserStatus } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import { PasswordService } from '@mtw/security';
import { resolveAdminRoleName } from '@mtw/contracts';
import type {
  AdminUserQueryDto,
  AdminUserRecord,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto';

type AdminAuthRow = AdminUserRecord & { passwordHash: string };

@Injectable()
export class AdminUsersRepository {
  private readonly memoryStore = new Map<string, AdminAuthRow>();
  private readonly refreshByHash = new Map<
    string,
    { adminId: string; expiresAt: number }
  >();
  private seeded = false;

  constructor(
    private readonly passwords: PasswordService,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {}

  async ensureSeed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    const email = 'admn@misbaholidays.com';
    const passwordHash = await this.passwords.hash('Misba@2026');
    const now = new Date().toISOString();
    const seed: AdminAuthRow = {
      id: 'admin_super_01',
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      phone: null,
      address: 'Mumbai',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
      status: 'ACTIVE',
      mfaEnabled: false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      isEmailVerified: true,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryStore.set(seed.id, seed);

    if (this.prisma) {
      try {
        await this.prisma.adminUser.upsert({
          where: { email },
          create: {
            id: seed.id,
            email: seed.email,
            passwordHash: seed.passwordHash,
            firstName: seed.firstName,
            lastName: seed.lastName,
            displayName: seed.displayName,
            phone: seed.phone,
            address: seed.address,
            roleCode: seed.roleCode,
            roleName: seed.roleName,
            status: seed.status as UserStatus,
            mfaEnabled: seed.mfaEnabled,
            mustChangePassword: seed.mustChangePassword,
            isEmailVerified: seed.isEmailVerified,
            passwordChangedAt: new Date(),
          },
          update: {
            passwordHash: seed.passwordHash,
            firstName: seed.firstName,
            lastName: seed.lastName,
            displayName: seed.displayName,
            phone: seed.phone,
            address: seed.address,
            roleCode: seed.roleCode,
            roleName: seed.roleName,
            status: 'ACTIVE',
            failedLoginAttempts: 0,
            lockedUntil: null,
            mustChangePassword: false,
            isEmailVerified: true,
            passwordChangedAt: new Date(),
          },
        });
      } catch {
        // ignore if db unavailable
      }
    }
  }

  async create(input: CreateAdminUserDto): Promise<AdminUserRecord> {
    await this.ensureSeed();
    const id = `admin_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const roleCode = input.roleCode ?? 'ADMIN';
    const passwordHash = await this.passwords.hash(input.password);
    const row: AdminAuthRow = {
      id,
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName:
        input.displayName?.trim() || `${input.firstName} ${input.lastName}`.trim(),
      phone: input.phone ?? null,
      address: input.address ?? null,
      roleCode,
      roleName: resolveAdminRoleName(roleCode, input.roleName),
      status: input.status ?? 'ACTIVE',
      mfaEnabled: input.mfaEnabled ?? false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: input.mustChangePassword ?? false,
      isEmailVerified: input.isEmailVerified ?? true,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(id, row);

    if (this.prisma) {
      try {
        await this.prisma.adminUser.create({
          data: {
            id: row.id,
            email: row.email,
            passwordHash: row.passwordHash,
            firstName: row.firstName,
            lastName: row.lastName,
            displayName: row.displayName,
            phone: row.phone,
            address: row.address,
            roleCode: row.roleCode,
            roleName: row.roleName,
            status: row.status as UserStatus,
            mfaEnabled: row.mfaEnabled,
            mustChangePassword: row.mustChangePassword,
            isEmailVerified: row.isEmailVerified,
            createdBy: row.createdBy,
            passwordChangedAt: new Date(),
          },
        });
      } catch {
        // fallback memory
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'admin_user',
          aggregateId: id,
          eventType: 'admin_user.created',
          payload: { adminId: id, email: row.email, roleCode: row.roleCode },
        });
      } catch {
        // non-blocking
      }
    }

    return this.toPublic(row);
  }

  async findAll(query?: AdminUserQueryDto): Promise<{
    items: AdminUserRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.ensureSeed();
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where: Prisma.AdminUserWhereInput = {};
        if (query?.status) where.status = query.status as UserStatus;
        if (query?.roleCode) where.roleCode = query.roleCode;
        if (query?.search) {
          where.OR = [
            { email: { contains: query.search } },
            { displayName: { contains: query.search } },
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
          ];
        }
        const [rows, total] = await Promise.all([
          this.prisma.adminUser.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.adminUser.count({ where }),
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

    let all = Array.from(this.memoryStore.values()).map((r) => this.toPublic(r));
    if (query?.status) all = all.filter((i) => i.status === query.status);
    if (query?.roleCode) all = all.filter((i) => i.roleCode === query.roleCode);
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter(
        (i) =>
          i.email.includes(s) ||
          i.displayName.toLowerCase().includes(s) ||
          i.firstName.toLowerCase().includes(s) ||
          i.lastName.toLowerCase().includes(s),
      );
    }
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

  async findById(id: string): Promise<AdminAuthRow | null> {
    await this.ensureSeed();
    if (this.prisma) {
      try {
        const row = await this.prisma.adminUser.findUnique({ where: { id } });
        if (row) return this.mapAuthFromPrisma(row);
      } catch {
        // fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<AdminAuthRow | null> {
    await this.ensureSeed();
    const normalized = email.trim().toLowerCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.adminUser.findUnique({
          where: { email: normalized },
        });
        if (row) return this.mapAuthFromPrisma(row);
      } catch {
        // fallback
      }
    }
    return (
      Array.from(this.memoryStore.values()).find((r) => r.email === normalized) ??
      null
    );
  }

  async update(
    id: string,
    input: UpdateAdminUserDto,
  ): Promise<AdminUserRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const roleCode = input.roleCode ?? existing.roleCode;
    const passwordHash = input.password
      ? await this.passwords.hash(input.password)
      : existing.passwordHash;

    const updated: AdminAuthRow = {
      ...existing,
      email: input.email ? input.email.toLowerCase() : existing.email,
      passwordHash,
      firstName: input.firstName ?? existing.firstName,
      lastName: input.lastName ?? existing.lastName,
      displayName:
        input.displayName ??
        (input.firstName || input.lastName
          ? `${input.firstName ?? existing.firstName} ${input.lastName ?? existing.lastName}`.trim()
          : existing.displayName),
      phone: input.phone !== undefined ? input.phone : existing.phone,
      address: input.address !== undefined ? input.address : existing.address,
      roleCode,
      roleName: resolveAdminRoleName(
        roleCode,
        input.roleName ?? existing.roleName,
      ),
      status: input.status ?? existing.status,
      mfaEnabled:
        input.mfaEnabled !== undefined ? input.mfaEnabled : existing.mfaEnabled,
      mustChangePassword:
        input.mustChangePassword !== undefined
          ? input.mustChangePassword
          : existing.mustChangePassword,
      isEmailVerified:
        input.isEmailVerified !== undefined
          ? input.isEmailVerified
          : existing.isEmailVerified,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      try {
        await this.prisma.adminUser.update({
          where: { id },
          data: {
            email: updated.email,
            passwordHash: updated.passwordHash,
            firstName: updated.firstName,
            lastName: updated.lastName,
            displayName: updated.displayName,
            phone: updated.phone,
            address: updated.address,
            roleCode: updated.roleCode,
            roleName: updated.roleName,
            status: updated.status as UserStatus,
            mfaEnabled: updated.mfaEnabled,
            mustChangePassword: updated.mustChangePassword,
            isEmailVerified: updated.isEmailVerified,
            ...(input.password ? { passwordChangedAt: new Date() } : {}),
          },
        });
      } catch {
        // fallback
      }
    }

    return this.toPublic(updated);
  }

  async recordLoginSuccess(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) return;
    const updated: AdminAuthRow = {
      ...existing,
      lastLoginAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    };
    this.memoryStore.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.adminUser.update({
          where: { id },
          data: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      } catch {
        // ignore
      }
    }
  }

  async recordLoginFailure(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) return;
    const attempts = existing.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= 5
        ? new Date(Date.now() + 15 * 60_000).toISOString()
        : existing.lockedUntil;
    const updated: AdminAuthRow = {
      ...existing,
      failedLoginAttempts: attempts,
      lockedUntil,
      updatedAt: new Date().toISOString(),
    };
    this.memoryStore.set(id, updated);
    if (this.prisma) {
      try {
        await this.prisma.adminUser.update({
          where: { id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: lockedUntil ? new Date(lockedUntil) : null,
          },
        });
      } catch {
        // ignore
      }
    }
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    this.memoryStore.delete(id);
    if (this.prisma) {
      try {
        await this.prisma.adminUser.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    return true;
  }

  async storeRefreshToken(adminId: string, refreshToken: string): Promise<void> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60_000;
    this.refreshByHash.set(hash, { adminId, expiresAt });

    if (this.prisma) {
      try {
        await this.prisma.adminRefreshToken.create({
          data: {
            id: `art_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
            adminId,
            tokenHash: hash,
            familyId: randomBytes(8).toString('hex'),
            expiresAt: new Date(expiresAt),
          },
        });
      } catch {
        // memory fallback
      }
    }
  }

  async consumeRefreshToken(refreshToken: string): Promise<string | null> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');

    if (this.prisma) {
      try {
        const row = await this.prisma.adminRefreshToken.findFirst({
          where: {
            tokenHash: hash,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        });
        if (row) {
          await this.prisma.adminRefreshToken.update({
            where: { id: row.id },
            data: { revokedAt: new Date() },
          });
          return row.adminId;
        }
      } catch {
        // fallback
      }
    }

    const mem = this.refreshByHash.get(hash);
    if (!mem || mem.expiresAt < Date.now()) return null;
    this.refreshByHash.delete(hash);
    return mem.adminId;
  }

  private toPublic(row: AdminAuthRow): AdminUserRecord {
    const { passwordHash: _passwordHash, ...publicRow } = row;
    return publicRow;
  }

  private mapFromPrisma(row: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string | null;
    address: string | null;
    roleCode: string;
    roleName: string;
    status: string;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    mustChangePassword: boolean;
    isEmailVerified: boolean;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminUserRecord {
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      displayName: row.displayName,
      phone: row.phone,
      address: row.address,
      roleCode: row.roleCode as AdminUserRecord['roleCode'],
      roleName: row.roleName,
      status: row.status as AdminUserRecord['status'],
      mfaEnabled: row.mfaEnabled,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil?.toISOString() ?? null,
      mustChangePassword: row.mustChangePassword,
      isEmailVerified: row.isEmailVerified,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapAuthFromPrisma(row: {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string | null;
    address: string | null;
    roleCode: string;
    roleName: string;
    status: string;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    mustChangePassword: boolean;
    isEmailVerified: boolean;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminAuthRow {
    return {
      ...this.mapFromPrisma(row),
      passwordHash: row.passwordHash,
    };
  }
}
