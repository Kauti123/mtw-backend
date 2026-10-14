import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import type {
  CreateEmployeeDto,
  EmployeeQueryDto,
  EmployeeRecord,
  UpdateEmployeeDto,
} from './dto';

type CorporateRef = { id: string; code: string; name: string };

type AccessJsonPayload = {
  permissions: EmployeeRecord['access'];
  isApprover: boolean;
  needsApprover: boolean;
  l1ApproverId: string | null;
  l2ApproverId: string | null;
};

function packAccessJson(record: Pick<
  EmployeeRecord,
  'access' | 'isApprover' | 'needsApprover' | 'l1ApproverId' | 'l2ApproverId'
>): AccessJsonPayload {
  return {
    permissions: record.access,
    isApprover: Boolean(record.isApprover),
    needsApprover: Boolean(record.needsApprover),
    l1ApproverId: record.l1ApproverId ?? null,
    l2ApproverId: record.l2ApproverId ?? null,
  };
}

function unpackAccessJson(accessJson: Prisma.JsonValue | null): AccessJsonPayload {
  if (Array.isArray(accessJson)) {
    return {
      permissions: accessJson as EmployeeRecord['access'],
      isApprover: false,
      needsApprover: false,
      l1ApproverId: null,
      l2ApproverId: null,
    };
  }
  if (accessJson && typeof accessJson === 'object') {
    const value = accessJson as Record<string, unknown>;
    const permissions = Array.isArray(value['permissions'])
      ? (value['permissions'] as EmployeeRecord['access'])
      : [];
    return {
      permissions,
      isApprover: Boolean(value['isApprover']),
      needsApprover: Boolean(value['needsApprover']),
      l1ApproverId:
        typeof value['l1ApproverId'] === 'string' ? value['l1ApproverId'] : null,
      l2ApproverId:
        typeof value['l2ApproverId'] === 'string' ? value['l2ApproverId'] : null,
    };
  }
  return {
    permissions: [],
    isApprover: false,
    needsApprover: false,
    l1ApproverId: null,
    l2ApproverId: null,
  };
}

@Injectable()
export class EmployeesRepository {
  private readonly memoryStore = new Map<string, EmployeeRecord>();
  private readonly memoryCorporates = new Map<string, CorporateRef>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
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

    const seeds: Array<Omit<EmployeeRecord, 'createdAt' | 'updatedAt'> & { joinedAt: string }> = [
      {
        id: 'emp_1001',
        corporateId: 'corp_acme_01',
        employeeCode: 'EMP-1001',
        email: 'aarav.sharma@acme.in',
        title: 'Mr',
        firstName: 'Aarav',
        lastName: 'Sharma',
        phone: '+91 98765 43210',
        gender: 'MALE',
        position: 'Software Engineer',
        departmentName: 'Engineering',
        costCenterName: 'CC-1002 · Engineering',
        address: null,
        city: null,
        state: null,
        pinCode: null,
        corporateName: 'Acme Travels Pvt Ltd',
        corporateCode: 'ACME',
        access: ['PERSONAL'],
        status: 'ACTIVE',
        grade: null,
        managerName: 'Kabir Khan',
        managerEmployeeId: null,
        isApprover: true,
        needsApprover: false,
        l1ApproverId: null,
        l2ApproverId: null,
        joinedAt: '2025-01-12T00:00:00.000Z',
      },
      {
        id: 'emp_1002',
        corporateId: 'corp_acme_01',
        employeeCode: 'EMP-1002',
        email: 'priya.nair@acme.in',
        title: 'Ms',
        firstName: 'Priya',
        lastName: 'Nair',
        phone: '+91 98123 45678',
        gender: 'FEMALE',
        position: 'Travel Coordinator',
        departmentName: 'Travel Desk',
        costCenterName: 'CC-1005 · Travel Desk',
        address: null,
        city: null,
        state: null,
        pinCode: null,
        corporateName: 'Acme Travels Pvt Ltd',
        corporateCode: 'ACME',
        access: ['ON_BEHALF_EMPLOYEE', 'PERSONAL'],
        status: 'ACTIVE',
        grade: null,
        managerName: 'Kabir Khan',
        managerEmployeeId: null,
        isApprover: true,
        needsApprover: true,
        l1ApproverId: 'emp_1001',
        l2ApproverId: null,
        joinedAt: '2025-03-03T00:00:00.000Z',
      },
      {
        id: 'emp_1003',
        corporateId: 'corp_nstr_01',
        employeeCode: 'EMP-1003',
        email: 'rohan.mehta@northstar.com',
        title: 'Mr',
        firstName: 'Rohan',
        lastName: 'Mehta',
        phone: '+91 99001 22334',
        gender: 'MALE',
        position: 'Finance Analyst',
        departmentName: 'Finance',
        costCenterName: 'CC-1001 · Head Office',
        address: null,
        city: null,
        state: null,
        pinCode: null,
        corporateName: 'Northstar Consulting',
        corporateCode: 'NSTR',
        access: ['PERSONAL'],
        status: 'PENDING',
        grade: null,
        managerName: 'Sneha Iyer',
        managerEmployeeId: null,
        isApprover: false,
        needsApprover: false,
        l1ApproverId: null,
        l2ApproverId: null,
        joinedAt: '2025-08-18T00:00:00.000Z',
      },
      {
        id: 'emp_1005',
        corporateId: 'corp_orbt_01',
        employeeCode: 'EMP-1005',
        email: 'vikram.rao@orbitlog.in',
        title: 'Mr',
        firstName: 'Vikram',
        lastName: 'Rao',
        phone: '+91 98887 66554',
        gender: 'MALE',
        position: 'Operations Lead',
        departmentName: 'Operations',
        costCenterName: 'CC-1004 · Operations',
        address: null,
        city: null,
        state: null,
        pinCode: null,
        corporateName: 'Orbit Logistics',
        corporateCode: 'ORBT',
        access: ['PERSONAL'],
        status: 'INACTIVE',
        grade: null,
        managerName: null,
        managerEmployeeId: null,
        isApprover: false,
        needsApprover: false,
        l1ApproverId: null,
        l2ApproverId: null,
        joinedAt: '2023-11-09T00:00:00.000Z',
      },
    ];

    for (const seed of seeds) {
      this.memoryStore.set(seed.id, {
        ...seed,
        createdAt: seed.joinedAt,
        updatedAt: now,
      });
    }
  }

  async resolveCorporate(input: {
    corporateId?: string;
    corporateCode?: string;
    corporateName?: string | null;
  }): Promise<CorporateRef | null> {
    if (input.corporateId) {
      if (this.prisma) {
        try {
          const row = await this.prisma.corporate.findUnique({
            where: { id: input.corporateId },
          });
          if (row) {
            return { id: row.id, code: row.code, name: row.legalName };
          }
        } catch {
          // Fallback
        }
      }
      const memory = this.memoryCorporates.get(input.corporateId);
      if (memory) return memory;
    }

    const code = input.corporateCode?.trim().toUpperCase();
    if (code) {
      if (this.prisma) {
        try {
          let row = await this.prisma.corporate.findUnique({ where: { code } });
          if (!row) {
            row = await this.prisma.corporate.create({
              data: {
                id: `corp_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
                code,
                legalName: input.corporateName?.trim() || code,
                status: 'ACTIVE',
              },
            });
          }
          return { id: row.id, code: row.code, name: row.legalName };
        } catch {
          // Fallback
        }
      }

      const existing = this.memoryCorporates.get(code);
      if (existing) return existing;
      const created: CorporateRef = {
        id: `corp_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        code,
        name: input.corporateName?.trim() || code,
      };
      this.memoryCorporates.set(created.id, created);
      this.memoryCorporates.set(created.code, created);
      return created;
    }

    return null;
  }

  async create(input: CreateEmployeeDto & { corporateId: string }): Promise<EmployeeRecord> {
    const id = `emp_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const joinedAt = input.joinedAt ?? now;
    const record: EmployeeRecord = {
      id,
      corporateId: input.corporateId,
      employeeCode: input.employeeCode.toUpperCase(),
      email: input.email.toLowerCase(),
      title: input.title ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      phone: input.phone ?? null,
      gender: input.gender ?? null,
      position: input.position ?? null,
      departmentName: input.departmentName ?? null,
      costCenterName: input.costCenterName ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      pinCode: input.pinCode ?? null,
      corporateName: input.corporateName ?? null,
      corporateCode: input.corporateCode ?? null,
      access: input.access ?? [],
      status: input.status ?? 'ACTIVE',
      grade: input.grade ?? null,
      managerName: input.managerName ?? null,
      managerEmployeeId: input.managerEmployeeId ?? null,
      isApprover: input.isApprover ?? false,
      needsApprover: input.needsApprover ?? false,
      l1ApproverId: input.l1ApproverId ?? null,
      l2ApproverId: input.l2ApproverId ?? null,
      joinedAt,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(record.id, record);

    if (this.prisma) {
      try {
        const departmentId = await this.ensureDepartment(
          record.corporateId,
          record.departmentName,
        );
        const costCenterId = await this.ensureCostCenter(
          record.corporateId,
          record.costCenterName,
        );
        await this.prisma.corporateEmployee.create({
          data: {
            id: record.id,
            corporateId: record.corporateId,
            employeeCode: record.employeeCode,
            email: record.email,
            title: record.title,
            firstName: record.firstName,
            lastName: record.lastName,
            phone: record.phone,
            gender: record.gender,
            position: record.position,
            departmentName: record.departmentName,
            costCenterName: record.costCenterName,
            address: record.address,
            city: record.city,
            state: record.state,
            pinCode: record.pinCode,
            corporateName: record.corporateName,
            corporateCode: record.corporateCode,
            accessJson: packAccessJson(record),
            departmentId,
            costCenterId,
            grade: record.grade,
            managerName: record.managerName,
            managerEmployeeId: record.managerEmployeeId,
            status: record.status,
            joinedAt: joinedAt ? new Date(joinedAt) : null,
          },
        });
      } catch {
        // Fallback to memory
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate_employee',
          aggregateId: record.id,
          eventType: 'corporate_employee.created',
          payload: {
            employeeId: record.id,
            employeeCode: record.employeeCode,
            corporateId: record.corporateId,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return record;
  }

  async findAll(query?: EmployeeQueryDto): Promise<{
    items: EmployeeRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where = this.buildWhere(query);
        const [rows, total] = await Promise.all([
          this.prisma.corporateEmployee.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.corporateEmployee.count({ where }),
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
    all = this.filterMemory(all, query);
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

  async findById(id: string): Promise<EmployeeRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.corporateEmployee.findUnique({
          where: { id },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async findByCode(
    corporateId: string,
    employeeCode: string,
  ): Promise<EmployeeRecord | null> {
    const normalized = employeeCode.trim().toUpperCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.corporateEmployee.findUnique({
          where: {
            corporateId_employeeCode: {
              corporateId,
              employeeCode: normalized,
            },
          },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return (
      Array.from(this.memoryStore.values()).find(
        (item) =>
          item.corporateId === corporateId && item.employeeCode === normalized,
      ) ?? null
    );
  }

  async findByEmail(
    corporateId: string,
    email: string,
  ): Promise<EmployeeRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.corporateEmployee.findFirst({
          where: { corporateId, email: normalized },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return (
      Array.from(this.memoryStore.values()).find(
        (item) =>
          item.corporateId === corporateId && item.email === normalized,
      ) ?? null
    );
  }

  async update(
    id: string,
    input: UpdateEmployeeDto,
  ): Promise<EmployeeRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: EmployeeRecord = {
      ...existing,
      employeeCode: input.employeeCode
        ? input.employeeCode.toUpperCase()
        : existing.employeeCode,
      email: input.email ? input.email.toLowerCase() : existing.email,
      title: input.title !== undefined ? input.title : existing.title,
      firstName:
        input.firstName !== undefined ? input.firstName : existing.firstName,
      lastName:
        input.lastName !== undefined ? input.lastName : existing.lastName,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      gender: input.gender !== undefined ? input.gender : existing.gender,
      position:
        input.position !== undefined ? input.position : existing.position,
      departmentName:
        input.departmentName !== undefined
          ? input.departmentName
          : existing.departmentName,
      costCenterName:
        input.costCenterName !== undefined
          ? input.costCenterName
          : existing.costCenterName,
      address: input.address !== undefined ? input.address : existing.address,
      city: input.city !== undefined ? input.city : existing.city,
      state: input.state !== undefined ? input.state : existing.state,
      pinCode: input.pinCode !== undefined ? input.pinCode : existing.pinCode,
      corporateName:
        input.corporateName !== undefined
          ? input.corporateName
          : existing.corporateName,
      corporateCode:
        input.corporateCode !== undefined
          ? input.corporateCode
          : existing.corporateCode,
      access: input.access !== undefined ? input.access : existing.access,
      status: input.status ?? existing.status,
      grade: input.grade !== undefined ? input.grade : existing.grade,
      managerName:
        input.managerName !== undefined ? input.managerName : existing.managerName,
      managerEmployeeId:
        input.managerEmployeeId !== undefined
          ? input.managerEmployeeId
          : existing.managerEmployeeId,
      isApprover:
        input.isApprover !== undefined ? input.isApprover : existing.isApprover,
      needsApprover:
        input.needsApprover !== undefined
          ? input.needsApprover
          : existing.needsApprover,
      l1ApproverId:
        input.l1ApproverId !== undefined
          ? input.l1ApproverId
          : existing.l1ApproverId,
      l2ApproverId:
        input.l2ApproverId !== undefined
          ? input.l2ApproverId
          : existing.l2ApproverId,
      joinedAt:
        input.joinedAt !== undefined ? input.joinedAt : existing.joinedAt,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      try {
        const departmentId = await this.ensureDepartment(
          updated.corporateId,
          updated.departmentName,
        );
        const costCenterId = await this.ensureCostCenter(
          updated.corporateId,
          updated.costCenterName,
        );
        await this.prisma.corporateEmployee.update({
          where: { id },
          data: {
            employeeCode: updated.employeeCode,
            email: updated.email,
            title: updated.title,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phone: updated.phone,
            gender: updated.gender,
            position: updated.position,
            departmentName: updated.departmentName,
            costCenterName: updated.costCenterName,
            address: updated.address,
            city: updated.city,
            state: updated.state,
            pinCode: updated.pinCode,
            corporateName: updated.corporateName,
            corporateCode: updated.corporateCode,
            accessJson: packAccessJson(updated),
            departmentId,
            costCenterId,
            grade: updated.grade,
            managerName: updated.managerName,
            managerEmployeeId: updated.managerEmployeeId,
            status: updated.status,
            joinedAt: updated.joinedAt ? new Date(updated.joinedAt) : null,
          },
        });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate_employee',
          aggregateId: updated.id,
          eventType: 'corporate_employee.updated',
          payload: {
            employeeId: updated.id,
            employeeCode: updated.employeeCode,
            corporateId: updated.corporateId,
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
        await this.prisma.corporateEmployee.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate_employee',
          aggregateId: id,
          eventType: 'corporate_employee.deleted',
          payload: {
            employeeId: id,
            employeeCode: existing.employeeCode,
            corporateId: existing.corporateId,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return true;
  }

  async nextEmployeeCode(corporateId?: string): Promise<string> {
    let max = 1000;

    if (this.prisma) {
      try {
        const rows = await this.prisma.corporateEmployee.findMany({
          where: corporateId ? { corporateId } : undefined,
          select: { employeeCode: true },
        });
        for (const row of rows) {
          const match = row.employeeCode.match(/(\d+)$/);
          if (match) max = Math.max(max, Number(match[1]));
        }
        return `EMP-${max + 1}`;
      } catch {
        // Fallback
      }
    }

    for (const item of this.memoryStore.values()) {
      if (corporateId && item.corporateId !== corporateId) continue;
      const match = item.employeeCode.match(/(\d+)$/);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return `EMP-${max + 1}`;
  }

  private async ensureDepartment(
    corporateId: string,
    name: string | null,
  ): Promise<string | null> {
    if (!name || !this.prisma) return null;
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    try {
      const existing = await this.prisma.department.findUnique({
        where: { corporateId_code: { corporateId, code } },
      });
      if (existing) return existing.id;
      const created = await this.prisma.department.create({
        data: {
          id: `dept_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
          corporateId,
          name,
          code: code || `DEPT_${Date.now()}`,
        },
      });
      return created.id;
    } catch {
      return null;
    }
  }

  private async ensureCostCenter(
    corporateId: string,
    name: string | null,
  ): Promise<string | null> {
    if (!name || !this.prisma) return null;
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    try {
      const existing = await this.prisma.costCenter.findUnique({
        where: { corporateId_code: { corporateId, code } },
      });
      if (existing) return existing.id;
      const created = await this.prisma.costCenter.create({
        data: {
          id: `cc_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
          corporateId,
          name,
          code: code || `CC_${Date.now()}`,
        },
      });
      return created.id;
    } catch {
      return null;
    }
  }

  private buildWhere(query?: EmployeeQueryDto): Prisma.CorporateEmployeeWhereInput {
    const where: Prisma.CorporateEmployeeWhereInput = {};
    if (query?.status) where.status = query.status;
    if (query?.departmentName) where.departmentName = query.departmentName;
    if (query?.position) where.position = query.position;
    if (query?.corporateId) where.corporateId = query.corporateId;
    if (query?.corporateCode) where.corporateCode = query.corporateCode;
    if (query?.dateFrom || query?.dateTo) {
      where.joinedAt = {};
      if (query.dateFrom) where.joinedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.joinedAt.lte = end;
      }
    }
    if (query?.search) {
      where.OR = [
        { employeeCode: { contains: query.search } },
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { departmentName: { contains: query.search } },
        { position: { contains: query.search } },
        { corporateName: { contains: query.search } },
      ];
    }
    return where;
  }

  private filterMemory(
    all: EmployeeRecord[],
    query?: EmployeeQueryDto,
  ): EmployeeRecord[] {
    let items = all;
    if (query?.status) items = items.filter((item) => item.status === query.status);
    if (query?.departmentName) {
      items = items.filter((item) => item.departmentName === query.departmentName);
    }
    if (query?.position) {
      items = items.filter((item) => item.position === query.position);
    }
    if (query?.corporateId) {
      items = items.filter((item) => item.corporateId === query.corporateId);
    }
    if (query?.corporateCode) {
      items = items.filter((item) => item.corporateCode === query.corporateCode);
    }
    if (query?.dateFrom) {
      items = items.filter(
        (item) => (item.joinedAt ?? item.createdAt).slice(0, 10) >= query.dateFrom!,
      );
    }
    if (query?.dateTo) {
      items = items.filter(
        (item) => (item.joinedAt ?? item.createdAt).slice(0, 10) <= query.dateTo!,
      );
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      items = items.filter((item) =>
        [
          item.employeeCode,
          item.email,
          item.firstName,
          item.lastName,
          item.departmentName,
          item.position,
          item.corporateName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
      );
    }
    return items;
  }

  private mapFromPrisma(row: {
    id: string;
    corporateId: string;
    employeeCode: string;
    email: string;
    title: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    gender: string | null;
    position: string | null;
    departmentName: string | null;
    costCenterName: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    corporateName: string | null;
    corporateCode: string | null;
    accessJson: Prisma.JsonValue | null;
    status: string;
    grade: string | null;
    managerName: string | null;
    managerEmployeeId: string | null;
    joinedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): EmployeeRecord {
    const packed = unpackAccessJson(row.accessJson);
    return {
      id: row.id,
      corporateId: row.corporateId,
      employeeCode: row.employeeCode,
      email: row.email,
      title: row.title,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      gender: (row.gender as EmployeeRecord['gender']) ?? null,
      position: row.position,
      departmentName: row.departmentName,
      costCenterName: row.costCenterName,
      address: row.address,
      city: row.city,
      state: row.state,
      pinCode: row.pinCode,
      corporateName: row.corporateName,
      corporateCode: row.corporateCode,
      access: packed.permissions,
      status: row.status as EmployeeRecord['status'],
      grade: row.grade,
      managerName: row.managerName,
      managerEmployeeId: row.managerEmployeeId,
      isApprover: packed.isApprover,
      needsApprover: packed.needsApprover,
      l1ApproverId: packed.l1ApproverId,
      l2ApproverId: packed.l2ApproverId,
      joinedAt: row.joinedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
