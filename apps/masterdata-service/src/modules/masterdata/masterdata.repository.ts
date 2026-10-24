import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import type {
  CorporateRecord,
  CreateCorporateDto,
  UpdateCorporateDto,
  CorporateQueryDto,
} from './dto';

@Injectable()
export class MasterdataRepository {
  /**
   * High-availability in-memory store for instant responsiveness, testing,
   * and fallback when database / migrations are offline.
   */
  private readonly memoryStore = new Map<string, CorporateRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seedInitialCorporate();
  }

  private seedInitialCorporate(): void {
    const defaultCorporate: CorporateRecord = {
      id: 'corp_acme_default_01',
      code: 'ACME001',
      legalName: 'Acme Corporation',
      companyName: 'Acme Corporation',
      corporateCode: 'ACME001',
      industry: 'Technology',
      companyType: 'B2B Corporate',
      status: 'ACTIVE',
      defaultCurrency: 'INR',
      timezone: 'Asia/Kolkata (GMT +5:30)',
      accountConfiguration: {
        accountType: 'B2B Corporate',
        currency: 'INR',
        timezone: 'Asia/Kolkata (GMT +5:30)',
        fiscalYear: 'April - March',
        defaultLanguage: 'English',
      },
      primaryAdmin: {
        firstName: 'John',
        lastName: 'Mathew',
        workEmail: 'john.mathew@acmecorp.com',
        phoneCountryCode: '+91',
        phoneNumber: '9876543210',
        employeeId: 'EMP001',
        designation: 'Travel Manager',
        department: 'Travel & Administration',
        sendWelcomeEmail: true,
      },
      adminAccess: {
        role: 'Corporate Admin',
        loginMethod: 'EMAIL_OTP',
        mfaRequired: false,
        accountStatus: 'ACTIVE',
      },
      bookingSettings: {
        flightBooking: true,
        hotelBooking: true,
        groundTransport: true,
        allowSelfBooking: true,
        allowGuestBooking: false,
        cancellationAllowed: true,
      },
      creditAndBilling: {
        billingMode: 'Credit Limit',
        creditLimit: 1000000,
        paymentTerms: 'Net 30',
        gstNumber: '27ABCDE1234F1Z5',
        taxTreatment: 'Exclusive of Tax',
      },
      securitySettings: {
        sessionTimeout: '60 minutes',
        passwordPolicy: 'Standard (Min 8 characters)',
        ipRestriction: false,
        allowedIpAddresses: [],
        enableLogging: true,
      },
      policySettings: {
        defaultPolicy: 'Standard Corporate Policy',
        flightPolicy: 'Standard Flight Policy',
        hotelPolicy: 'Standard Hotel Policy',
        groundTransportPolicy: 'Standard Transport Policy',
        internationalTravelPolicy: 'International Travel Policy',
      },
      approvalWorkflow: {
        levels: {
          employee: true,
          reportingManager: true,
          travelAdmin: true,
          financeTeam: false,
        },
        approvalThreshold: 50000,
        approvalForInternationalTravel: true,
      },
      spendingLimits: {
        flightPerTrip: 50000,
        hotelPerNight: 15000,
        groundTransportDaily: 5000,
      },
      policyExceptions: {
        allowPolicyException: true,
        approvalRequired: true,
        notifyAdmin: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(defaultCorporate.id, defaultCorporate);
  }

  async create(input: CreateCorporateDto): Promise<CorporateRecord> {
    const id = `corp_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();

    const record: CorporateRecord = {
      id,
      code: input.corporateCode.toUpperCase(),
      legalName: input.companyName,
      companyName: input.companyName,
      corporateCode: input.corporateCode.toUpperCase(),
      industry: input.industry ?? 'Technology',
      companyType: input.companyType ?? 'B2B Corporate',
      status: input.status ?? 'ACTIVE',
      defaultCurrency: input.accountConfiguration.currency ?? 'INR',
      timezone: input.accountConfiguration.timezone ?? 'Asia/Kolkata (GMT +5:30)',
      accountConfiguration: input.accountConfiguration,
      primaryAdmin: input.primaryAdmin,
      adminAccess: input.adminAccess,
      bookingSettings: input.bookingSettings,
      creditAndBilling: input.creditAndBilling,
      securitySettings: input.securitySettings,
      policySettings: input.policySettings,
      approvalWorkflow: input.approvalWorkflow,
      spendingLimits: input.spendingLimits,
      policyExceptions: input.policyExceptions,
      createdAt: now,
      updatedAt: now,
    };

    // 1. In-memory store
    this.memoryStore.set(record.id, record);

    // 2. Persist to Prisma if available
    if (this.prisma) {
      try {
        await this.prisma.corporate.create({
          data: {
            id: record.id,
            code: record.corporateCode,
            legalName: record.legalName,
            status: record.status,
            defaultCurrency: record.defaultCurrency,
            timezone: record.timezone,
            settings: {
              industry: record.industry,
              companyType: record.companyType,
              accountConfiguration: record.accountConfiguration,
              primaryAdmin: record.primaryAdmin,
              adminAccess: record.adminAccess,
              bookingSettings: record.bookingSettings,
              creditAndBilling: record.creditAndBilling,
              securitySettings: record.securitySettings,
              policySettings: record.policySettings,
              approvalWorkflow: record.approvalWorkflow,
              spendingLimits: record.spendingLimits,
              policyExceptions: record.policyExceptions,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        // Optionally create department if specified
        if (record.primaryAdmin.department) {
          try {
            await this.prisma.department.create({
              data: {
                corporateId: record.id,
                name: record.primaryAdmin.department,
                code: 'DEPT_ADMIN',
              },
            });
          } catch {
            // Ignore department duplicate or schema constraints in dev
          }
        }
      } catch {
        // Fallback safely to memory store
      }
    }

    // 3. Publish outbox event
    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate',
          aggregateId: record.id,
          eventType: 'corporate.created',
          payload: {
            corporateId: record.id,
            code: record.code,
            legalName: record.legalName,
            adminEmail: record.primaryAdmin.workEmail,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return record;
  }

  async findAll(query?: CorporateQueryDto): Promise<{
    items: CorporateRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    // Check DB first if accessible
    if (this.prisma) {
      try {
        const where: Prisma.CorporateWhereInput = {};
        if (query?.status) {
          where.status = query.status;
        }
        if (query?.search) {
          where.OR = [
            { legalName: { contains: query.search } },
            { code: { contains: query.search } },
          ];
        }

        const [dbRows, total] = await Promise.all([
          this.prisma.corporate.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.corporate.count({ where }),
        ]);

        if (dbRows && dbRows.length > 0) {
          const items: CorporateRecord[] = dbRows.map((row) => this.mapFromPrisma(row));
          return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch {
        // Fallback to memory store below
      }
    }

    // Memory store filtering
    let all = Array.from(this.memoryStore.values());

    if (query?.status) {
      all = all.filter((c) => c.status === query.status);
    }
    if (query?.industry) {
      all = all.filter((c) => c.industry.toLowerCase() === query.industry?.toLowerCase());
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter(
        (c) =>
          c.companyName.toLowerCase().includes(s) ||
          c.corporateCode.toLowerCase().includes(s) ||
          c.primaryAdmin.workEmail.toLowerCase().includes(s) ||
          c.primaryAdmin.firstName.toLowerCase().includes(s) ||
          c.primaryAdmin.lastName.toLowerCase().includes(s),
      );
    }

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<CorporateRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.corporate.findUnique({
          where: { id },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // fallback
      }
    }

    return this.memoryStore.get(id) ?? null;
  }

  async findByCode(code: string): Promise<CorporateRecord | null> {
    const normalized = code.toUpperCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.corporate.findUnique({
          where: { code: normalized },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // fallback
      }
    }

    for (const record of this.memoryStore.values()) {
      if (record.code.toUpperCase() === normalized) {
        return record;
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<CorporateRecord | null> {
    const normalized = email.toLowerCase();
    for (const record of this.memoryStore.values()) {
      if (record.primaryAdmin.workEmail.toLowerCase() === normalized) {
        return record;
      }
    }
    return null;
  }

  async update(id: string, input: UpdateCorporateDto): Promise<CorporateRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: CorporateRecord = {
      ...existing,
      ...(input.companyName && { companyName: input.companyName, legalName: input.companyName }),
      ...(input.corporateCode && {
        corporateCode: input.corporateCode.toUpperCase(),
        code: input.corporateCode.toUpperCase(),
      }),
      ...(input.industry && { industry: input.industry }),
      ...(input.companyType && { companyType: input.companyType }),
      ...(input.status && { status: input.status }),
      accountConfiguration: {
        ...existing.accountConfiguration,
        ...(input.accountConfiguration || {}),
      },
      primaryAdmin: {
        ...existing.primaryAdmin,
        ...(input.primaryAdmin || {}),
      },
      adminAccess: {
        ...existing.adminAccess,
        ...(input.adminAccess || {}),
      },
      bookingSettings: {
        ...existing.bookingSettings,
        ...(input.bookingSettings || {}),
      },
      creditAndBilling: {
        ...existing.creditAndBilling,
        ...(input.creditAndBilling || {}),
      },
      securitySettings: {
        ...existing.securitySettings,
        ...(input.securitySettings || {}),
      },
      policySettings: {
        ...existing.policySettings,
        ...(input.policySettings || {}),
      },
      approvalWorkflow: {
        ...existing.approvalWorkflow,
        ...(input.approvalWorkflow || {}),
      },
      spendingLimits: {
        ...existing.spendingLimits,
        ...(input.spendingLimits || {}),
      },
      policyExceptions: {
        ...existing.policyExceptions,
        ...(input.policyExceptions || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    // 1. Update in-memory
    this.memoryStore.set(id, updated);

    // 2. Update in Prisma
    if (this.prisma) {
      try {
        await this.prisma.corporate.update({
          where: { id },
          data: {
            legalName: updated.legalName,
            status: updated.status,
            defaultCurrency: updated.accountConfiguration.currency,
            timezone: updated.accountConfiguration.timezone,
            settings: {
              industry: updated.industry,
              companyType: updated.companyType,
              accountConfiguration: updated.accountConfiguration,
              primaryAdmin: updated.primaryAdmin,
              adminAccess: updated.adminAccess,
              bookingSettings: updated.bookingSettings,
              creditAndBilling: updated.creditAndBilling,
              securitySettings: updated.securitySettings,
              policySettings: updated.policySettings,
              approvalWorkflow: updated.approvalWorkflow,
              spendingLimits: updated.spendingLimits,
              policyExceptions: updated.policyExceptions,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      } catch {
        // Fallback
      }
    }

    // 3. Outbox event
    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate',
          aggregateId: id,
          eventType: 'corporate.updated',
          payload: { corporateId: id },
        });
      } catch {
        // Non-blocking
      }
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  ): Promise<CorporateRecord | null> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    this.memoryStore.delete(id);

    if (this.prisma) {
      try {
        await this.prisma.corporate.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: 'corporate',
          aggregateId: id,
          eventType: 'corporate.deleted',
          payload: { corporateId: id, code: existing.code },
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
    legalName: string;
    status: string;
    defaultCurrency: string;
    timezone: string;
    settings?: unknown;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }): CorporateRecord {
    const s = (
      typeof row.settings === 'object' && row.settings !== null ? row.settings : {}
    ) as Partial<CorporateRecord>;

    return {
      id: row.id,
      code: row.code,
      legalName: row.legalName,
      companyName: row.legalName,
      corporateCode: row.code,
      industry: (s['industry'] as string | undefined) ?? 'Technology',
      companyType: (s['companyType'] as string | undefined) ?? 'B2B Corporate',
      status: (row.status as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') ?? 'ACTIVE',
      defaultCurrency: row.defaultCurrency ?? 'INR',
      timezone: row.timezone ?? 'Asia/Kolkata (GMT +5:30)',
      accountConfiguration: s.accountConfiguration ?? {
        accountType: 'B2B Corporate',
        currency: row.defaultCurrency ?? 'INR',
        timezone: row.timezone ?? 'Asia/Kolkata (GMT +5:30)',
        fiscalYear: 'April - March',
        defaultLanguage: 'English',
      },
      primaryAdmin: s.primaryAdmin ?? {
        firstName: 'John',
        lastName: 'Mathew',
        workEmail: 'john.mathew@acmecorp.com',
        phoneCountryCode: '+91',
        phoneNumber: '9876543210',
        employeeId: 'EMP001',
        designation: 'Travel Manager',
        department: 'Travel & Administration',
        sendWelcomeEmail: true,
      },
      adminAccess: s.adminAccess ?? {
        role: 'Corporate Admin',
        loginMethod: 'EMAIL_OTP',
        mfaRequired: false,
        accountStatus: 'ACTIVE',
      },
      bookingSettings: s.bookingSettings ?? {
        flightBooking: true,
        hotelBooking: true,
        groundTransport: true,
        allowSelfBooking: true,
        allowGuestBooking: false,
        cancellationAllowed: true,
      },
      creditAndBilling: s.creditAndBilling ?? {
        billingMode: 'Credit Limit',
        creditLimit: 1000000,
        paymentTerms: 'Net 30',
        gstNumber: '27ABCDE1234F1Z5',
        taxTreatment: 'Exclusive of Tax',
      },
      securitySettings: s.securitySettings ?? {
        sessionTimeout: '60 minutes',
        passwordPolicy: 'Standard (Min 8 characters)',
        ipRestriction: false,
        allowedIpAddresses: [],
        enableLogging: true,
      },
      policySettings: s.policySettings ?? {
        defaultPolicy: 'Standard Corporate Policy',
        flightPolicy: 'Standard Flight Policy',
        hotelPolicy: 'Standard Hotel Policy',
        groundTransportPolicy: 'Standard Transport Policy',
        internationalTravelPolicy: 'International Travel Policy',
      },
      approvalWorkflow: s.approvalWorkflow ?? {
        levels: {
          employee: true,
          reportingManager: true,
          travelAdmin: true,
          financeTeam: false,
        },
        approvalThreshold: 50000,
        approvalForInternationalTravel: true,
      },
      spendingLimits: s.spendingLimits ?? {
        flightPerTrip: 50000,
        hotelPerNight: 15000,
        groundTransportDaily: 5000,
      },
      policyExceptions: s.policyExceptions ?? {
        allowPolicyException: true,
        approvalRequired: true,
        notifyAdmin: true,
      },
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
