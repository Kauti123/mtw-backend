import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@mtw/database';
import type {
  CreateSupplierAccountDto,
  SupplierAccountRecord,
  SupplierQueryDto,
  SupplierStatus,
} from './dto';

type Stored = SupplierAccountRecord & { passwordHash: string };

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS supplier_account (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NULL,
  contact_name VARCHAR(128) NULL,
  verticals VARCHAR(255) NULL,
  gst_number VARCHAR(64) NULL,
  country VARCHAR(64) NULL,
  city VARCHAR(128) NULL,
  address VARCHAR(512) NULL,
  website VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  notes TEXT NULL,
  validated_at DATETIME NULL,
  validated_by VARCHAR(64) NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

@Injectable()
export class SuppliersRepository {
  private readonly memory = new Map<string, Stored>();
  private tableReady = false;

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async ensureTable() {
    if (!this.prisma || this.tableReady) return;
    try {
      await this.prisma.$executeRawUnsafe(CREATE_TABLE);
      this.tableReady = true;
    } catch {
      this.tableReady = false;
    }
  }

  async create(
    input: CreateSupplierAccountDto,
    passwordHash: string,
  ): Promise<SupplierAccountRecord> {
    const now = new Date().toISOString();
    const code = input.supplierCode.trim().toUpperCase().replace(/\s+/g, '_');
    const row: Stored = {
      id: `sup_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      supplierCode: code,
      companyName: input.companyName.trim(),
      email: input.email.trim().toLowerCase(),
      contactName: input.contactName?.trim() || '',
      phone: input.phone?.trim() || '',
      website: input.website?.trim() || '',
      gstNumber: input.gstNumber?.trim() || '',
      country: input.country?.trim() || '',
      city: input.city?.trim() || '',
      address: input.address?.trim() || '',
      verticals: (input.verticals ?? []).map((item) => item.trim().toUpperCase()).filter(Boolean),
      status: 'PENDING',
      notes: input.notes?.trim() || '',
      validatedAt: null,
      validatedBy: null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      passwordConfigured: true,
      passwordHash,
    };
    this.memory.set(row.id, row);
    await this.ensureTable();
    if (this.prisma && this.tableReady) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO supplier_account
            (id, code, company_name, email, password_hash, phone, contact_name, verticals, gst_number, country, city, address, website, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row.id,
          row.supplierCode,
          row.companyName,
          row.email,
          passwordHash,
          row.phone || null,
          row.contactName || null,
          row.verticals.join(',') || null,
          row.gstNumber || null,
          row.country || null,
          row.city || null,
          row.address || null,
          row.website || null,
          row.status,
          row.notes || null,
        );
      } catch {
        // keep memory
      }
    }
    return this.toPublic(row);
  }

  async findById(id: string): Promise<Stored | null> {
    const mem = this.memory.get(id);
    if (mem) return mem;
    return this.readOne('id', id);
  }

  async findByCode(code: string): Promise<Stored | null> {
    const normalized = code.trim().toUpperCase();
    for (const row of this.memory.values()) {
      if (row.supplierCode === normalized) return row;
    }
    return this.readOne('code', normalized);
  }

  async findByEmail(email: string): Promise<Stored | null> {
    const normalized = email.trim().toLowerCase();
    for (const row of this.memory.values()) {
      if (row.email === normalized) return row;
    }
    return this.readOne('email', normalized);
  }

  async findAll(query: SupplierQueryDto): Promise<{
    items: SupplierAccountRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.hydrateFromDb();
    let items = Array.from(this.memory.values()).map((row) => this.toPublic(row));
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.vertical) {
      const vertical = query.vertical.toUpperCase();
      items = items.filter((item) => item.verticals.includes(vertical));
    }
    if (query.search?.trim()) {
      const search = query.search.trim().toLowerCase();
      items = items.filter((item) =>
        [item.companyName, item.supplierCode, item.email, item.contactName]
          .join(' ')
          .toLowerCase()
          .includes(search),
      );
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = items.length;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    };
  }

  async update(
    id: string,
    patch: Partial<SupplierAccountRecord> & { passwordHash?: string },
  ): Promise<SupplierAccountRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const next: Stored = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      passwordConfigured: Boolean(patch.passwordHash || existing.passwordHash),
      passwordHash: patch.passwordHash || existing.passwordHash,
    };
    this.memory.set(id, next);
    await this.ensureTable();
    if (this.prisma && this.tableReady) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE supplier_account SET
            company_name = ?, email = ?, phone = ?, contact_name = ?, verticals = ?, gst_number = ?,
            country = ?, city = ?, address = ?, website = ?, status = ?, notes = ?,
            validated_at = ?, validated_by = ?, last_login_at = ?,
            password_hash = ?
           WHERE id = ?`,
          next.companyName,
          next.email,
          next.phone || null,
          next.contactName || null,
          next.verticals.join(',') || null,
          next.gstNumber || null,
          next.country || null,
          next.city || null,
          next.address || null,
          next.website || null,
          next.status,
          next.notes || null,
          next.validatedAt ? new Date(next.validatedAt) : null,
          next.validatedBy,
          next.lastLoginAt ? new Date(next.lastLoginAt) : null,
          next.passwordHash,
          id,
        );
      } catch {
        // memory
      }
    }
    return this.toPublic(next);
  }

  async remove(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    this.memory.delete(id);
    await this.ensureTable();
    if (this.prisma && this.tableReady) {
      try {
        await this.prisma.$executeRawUnsafe(`DELETE FROM supplier_account WHERE id = ?`, id);
      } catch {
        // memory
      }
    }
    return true;
  }

  private async hydrateFromDb() {
    await this.ensureTable();
    if (!this.prisma || !this.tableReady) return;
    try {
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT * FROM supplier_account ORDER BY created_at DESC LIMIT 400`,
      )) as Array<Record<string, unknown>>;
      for (const row of rows) {
        const mapped = this.fromDb(row);
        this.memory.set(mapped.id, mapped);
      }
    } catch {
      // ignore
    }
  }

  private async readOne(column: 'id' | 'code' | 'email', value: string): Promise<Stored | null> {
    await this.ensureTable();
    if (!this.prisma || !this.tableReady) return null;
    try {
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT * FROM supplier_account WHERE ${column} = ? LIMIT 1`,
        value,
      )) as Array<Record<string, unknown>>;
      const row = rows[0];
      if (!row) return null;
      const mapped = this.fromDb(row);
      this.memory.set(mapped.id, mapped);
      return mapped;
    } catch {
      return null;
    }
  }

  private fromDb(row: Record<string, unknown>): Stored {
    const verticals = String(row['verticals'] ?? '')
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    const createdAt = this.toIso(row['created_at']);
    return {
      id: String(row['id']),
      supplierCode: String(row['code'] ?? ''),
      companyName: String(row['company_name'] ?? ''),
      email: String(row['email'] ?? ''),
      contactName: String(row['contact_name'] ?? ''),
      phone: String(row['phone'] ?? ''),
      website: String(row['website'] ?? ''),
      gstNumber: String(row['gst_number'] ?? ''),
      country: String(row['country'] ?? ''),
      city: String(row['city'] ?? ''),
      address: String(row['address'] ?? ''),
      verticals,
      status: (String(row['status'] ?? 'PENDING') as SupplierStatus) || 'PENDING',
      notes: String(row['notes'] ?? ''),
      validatedAt: this.toIso(row['validated_at']) || null,
      validatedBy: row['validated_by'] ? String(row['validated_by']) : null,
      lastLoginAt: this.toIso(row['last_login_at']) || null,
      createdAt,
      updatedAt: this.toIso(row['updated_at']) || createdAt,
      passwordConfigured: Boolean(row['password_hash']),
      passwordHash: String(row['password_hash'] ?? ''),
    };
  }

  private toIso(value: unknown) {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  toPublic(row: Stored): SupplierAccountRecord {
    const { passwordHash: _passwordHash, ...publicRow } = row;
    return publicRow;
  }
}
