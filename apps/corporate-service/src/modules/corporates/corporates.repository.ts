import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import type {
  CorporateRecord,
  CreateCorporateDto,
  UpdateCorporateDto,
  CorporateQueryDto,
  SecuritySettings,
} from './dto';

function sanitizeSecuritySettings(value?: Partial<SecuritySettings> | null): SecuritySettings {
  const source = value ?? {};
  return {
    sessionTimeout: source.sessionTimeout ?? '60 minutes',
    passwordPolicy: source.passwordPolicy ?? 'Standard (Min 8 characters)',
    ipRestriction: Boolean(source.ipRestriction),
    allowedIpAddresses: source.allowedIpAddresses ?? [],
    enableLogging: source.enableLogging ?? true,
    passwordConfigured: Boolean(
      source.passwordConfigured ||
        (source as { adminPasswordHash?: string }).adminPasswordHash,
    ),
  };
}

@Injectable()
export class CorporateRepository {
  private readonly memoryStore = new Map<string, CorporateRecord>();
  private readonly memoryAdminPasswords = new Map<
    string,
    { corporateId: string; email: string; passwordHash: string }
  >();

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
        passwordConfigured: false,
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

  async create(
    input: CreateCorporateDto,
    auth?: { passwordHash?: string },
  ): Promise<CorporateRecord> {
    const id = `corp_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const securitySettings = {
      ...input.securitySettings,
      password: undefined,
      confirmPassword: undefined,
      passwordConfigured: Boolean(auth?.passwordHash) || Boolean(input.securitySettings?.passwordConfigured),
    };

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
      companyDetails: input.companyDetails,
      accountConfiguration: input.accountConfiguration,
      primaryAdmin: input.primaryAdmin,
      adminAccess: input.adminAccess,
      bookingSettings: input.bookingSettings,
      creditAndBilling: input.creditAndBilling,
      securitySettings,
      policySettings: input.policySettings,
      approvalWorkflow: input.approvalWorkflow,
      spendingLimits: input.spendingLimits,
      policyExceptions: input.policyExceptions,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(record.id, record);
    if (auth?.passwordHash && input.primaryAdmin?.workEmail) {
      this.memoryAdminPasswords.set(
        input.primaryAdmin.workEmail.trim().toLowerCase(),
        {
          corporateId: record.id,
          passwordHash: auth.passwordHash,
          email: input.primaryAdmin.workEmail.trim().toLowerCase(),
        },
      );
    }

    const corporateEmail =
      input.companyDetails?.officialEmail?.trim().toLowerCase() ||
      input.primaryAdmin?.workEmail?.trim().toLowerCase() ||
      null;

    if (this.prisma) {
      try {
        await this.prisma.corporate.create({
          data: {
            id: record.id,
            code: record.corporateCode,
            legalName: record.legalName,
            email: corporateEmail,
            passwordHash: auth?.passwordHash || null,
            status: record.status,
            defaultCurrency: record.defaultCurrency,
            timezone: record.timezone,
            settings: {
              industry: record.industry,
              companyType: record.companyType,
              companyDetails: record.companyDetails,
              accountConfiguration: record.accountConfiguration,
              primaryAdmin: record.primaryAdmin,
              adminAccess: record.adminAccess,
              bookingSettings: record.bookingSettings,
              creditAndBilling: record.creditAndBilling,
              securitySettings: {
                ...securitySettings,
                // Persist hash only in DB settings for recovery; never expose via API record.
                ...(auth?.passwordHash ? { adminPasswordHash: auth.passwordHash } : {}),
              },
              policySettings: record.policySettings,
              approvalWorkflow: record.approvalWorkflow,
              spendingLimits: record.spendingLimits,
              policyExceptions: record.policyExceptions,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        if (auth?.passwordHash && input.primaryAdmin?.workEmail) {
          const email = input.primaryAdmin.workEmail.trim().toLowerCase();
          const existingUser = await this.prisma.authUserAccount.findUnique({
            where: { email },
          });
          if (existingUser) {
            await this.prisma.authUserAccount.update({
              where: { id: existingUser.id },
              data: {
                passwordHash: auth.passwordHash,
                corporateId: record.id,
                status: 'ACTIVE',
                mfaEnabled: Boolean(input.adminAccess?.mfaRequired),
              },
            });
          } else {
            await this.prisma.authUserAccount.create({
              data: {
                id: `user_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
                email,
                passwordHash: auth.passwordHash,
                corporateId: record.id,
                status: 'ACTIVE',
                mfaEnabled: Boolean(input.adminAccess?.mfaRequired),
              },
            });
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to persist corporate create';
        throw new Error(`Corporate create could not be saved to the database: ${message}`);
      }
    }

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

    if (this.prisma) {
      try {
        const where: Prisma.CorporateWhereInput = {};
        if (query?.status) where.status = query.status;
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
          return {
            items: dbRows.map((r) => this.mapFromPrisma(r)),
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
    if (query?.status) all = all.filter((c) => c.status === query.status);
    if (query?.industry) {
      all = all.filter(
        (c) => c.industry.toLowerCase() === query.industry?.toLowerCase(),
      );
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      all = all.filter(
        (c) =>
          c.companyName.toLowerCase().includes(s) ||
          c.corporateCode.toLowerCase().includes(s) ||
          c.primaryAdmin.workEmail.toLowerCase().includes(s),
      );
    }

    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

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
        const row = await this.prisma.corporate.findUnique({ where: { id } });
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
      if (record.code.toUpperCase() === normalized) return record;
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

  async update(
    id: string,
    input: UpdateCorporateDto,
    auth?: { passwordHash?: string },
  ): Promise<CorporateRecord | null> {
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
      companyDetails: {
        ...(existing.companyDetails || {}),
        ...(input.companyDetails || {}),
      },
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
      securitySettings: sanitizeSecuritySettings({
        ...existing.securitySettings,
        ...(input.securitySettings || {}),
        passwordConfigured:
          Boolean(existing.securitySettings?.passwordConfigured) ||
          Boolean(input.securitySettings?.password),
      }),
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

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      const corporateEmail =
        updated.companyDetails?.officialEmail?.trim().toLowerCase() ||
        updated.primaryAdmin?.workEmail?.trim().toLowerCase() ||
        undefined;
      const currency = String(updated.accountConfiguration?.currency || 'INR')
        .trim()
        .toUpperCase()
        .slice(0, 3) || 'INR';
      const timezone = String(
        updated.accountConfiguration?.timezone || updated.timezone || 'Asia/Kolkata',
      ).slice(0, 64);

      // Load prior settings so we never wipe keys (e.g. companyDetails) on partial writes.
      let priorSettings: Record<string, unknown> = {};
      try {
        const current = await this.prisma.corporate.findUnique({
          where: { id },
          select: { settings: true, passwordHash: true },
        });
        if (current?.settings && typeof current.settings === 'object' && !Array.isArray(current.settings)) {
          priorSettings = { ...(current.settings as Record<string, unknown>) };
        }
        const priorSecurityRaw = priorSettings['securitySettings'];
        const priorSecurity =
          priorSecurityRaw &&
          typeof priorSecurityRaw === 'object' &&
          !Array.isArray(priorSecurityRaw)
            ? (priorSecurityRaw as Record<string, unknown>)
            : {};

        await this.prisma.corporate.update({
          where: { id },
          data: {
            code: updated.corporateCode,
            legalName: updated.legalName,
            ...(corporateEmail ? { email: corporateEmail } : {}),
            ...(auth?.passwordHash ? { passwordHash: auth.passwordHash } : {}),
            status: updated.status,
            defaultCurrency: currency,
            timezone,
            settings: {
              ...priorSettings,
              industry: updated.industry,
              companyType: updated.companyType,
              companyDetails:
                updated.companyDetails ?? priorSettings['companyDetails'] ?? {},
              accountConfiguration: updated.accountConfiguration,
              primaryAdmin: updated.primaryAdmin,
              adminAccess: updated.adminAccess,
              bookingSettings: updated.bookingSettings,
              creditAndBilling: updated.creditAndBilling,
              securitySettings: {
                ...priorSecurity,
                ...updated.securitySettings,
                ...(auth?.passwordHash
                  ? { adminPasswordHash: auth.passwordHash }
                  : priorSecurity['adminPasswordHash']
                    ? { adminPasswordHash: priorSecurity['adminPasswordHash'] }
                    : {}),
              },
              policySettings: updated.policySettings,
              approvalWorkflow: updated.approvalWorkflow,
              spendingLimits: updated.spendingLimits,
              policyExceptions: updated.policyExceptions,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        // Keep AuthUserAccount in sync when primary admin email/password change.
        if (updated.primaryAdmin?.workEmail) {
          const adminEmail = updated.primaryAdmin.workEmail.trim().toLowerCase();
          const passwordHash = auth?.passwordHash || current?.passwordHash || undefined;
          if (passwordHash) {
            const existingUser = await this.prisma.authUserAccount.findUnique({
              where: { email: adminEmail },
            });
            if (existingUser) {
              await this.prisma.authUserAccount.update({
                where: { id: existingUser.id },
                data: {
                  passwordHash,
                  corporateId: id,
                  status: 'ACTIVE',
                  mfaEnabled: Boolean(updated.adminAccess?.mfaRequired),
                },
              });
            } else {
              await this.prisma.authUserAccount.create({
                data: {
                  id: `user_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
                  email: adminEmail,
                  passwordHash,
                  corporateId: id,
                  status: 'ACTIVE',
                  mfaEnabled: Boolean(updated.adminAccess?.mfaRequired),
                },
              });
            }
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to persist corporate update';
        throw new Error(`Corporate update could not be saved to the database: ${message}`);
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
    const s = (typeof row.settings === 'object' && row.settings !== null ? row.settings : {}) as Partial<CorporateRecord>;

    return {
      id: row.id,
      code: row.code,
      legalName: row.legalName,
      companyName: row.legalName,
      corporateCode: row.code,
      industry: s.industry ?? 'Technology',
      companyType: s.companyType ?? 'B2B Corporate',
      status: (row.status as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') ?? 'ACTIVE',
      defaultCurrency: row.defaultCurrency ?? 'INR',
      timezone: row.timezone ?? 'Asia/Kolkata (GMT +5:30)',
      companyDetails: s.companyDetails,
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
      securitySettings: sanitizeSecuritySettings(s.securitySettings),
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

export { CorporateRepository as CorporatesRepository };
