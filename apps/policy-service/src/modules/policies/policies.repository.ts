import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { OutboxService, PrismaService } from '@mtw/database';
import {
  defaultApprovalWorkflow,
  defaultAssignment,
  defaultSpendingLimits,
  defaultTravelRules,
  markStepCompleted,
} from '@mtw/contracts';
import type {
  CreateTravelPolicyDto,
  TravelPolicyQueryDto,
  TravelPolicyRecord,
  UpdateTravelPolicyDto,
} from './dto';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeModule<T extends Record<string, unknown>>(defaults: T, raw: unknown): T {
  const extra = asRecord(raw);
  return {
    ...defaults,
    ...extra,
    process: { ...asRecord(defaults.process), ...asRecord(extra.process) },
  } as T;
}

function mergeTravelRules(raw: unknown): TravelPolicyRecord['travelRules'] {
  const defaults = defaultTravelRules();
  const extra = asRecord(raw);
  return {
    ...defaults,
    ...extra,
    flights: mergeModule(asRecord(defaults.flights), extra.flights) as typeof defaults.flights,
    hotels: mergeModule(asRecord(defaults.hotels), extra.hotels) as typeof defaults.hotels,
    groundTransport: mergeModule(
      asRecord(defaults.groundTransport),
      extra.groundTransport,
    ) as typeof defaults.groundTransport,
    trains: mergeModule(asRecord(defaults.trains), extra.trains) as typeof defaults.trains,
    bus: mergeModule(asRecord(defaults.bus), extra.bus) as typeof defaults.bus,
    otherServices: mergeModule(
      asRecord(defaults.otherServices),
      extra.otherServices,
    ) as typeof defaults.otherServices,
  };
}

@Injectable()
export class PoliciesRepository {
  private readonly memoryStore = new Map<string, TravelPolicyRecord>();

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly outbox?: OutboxService,
  ) {
    this.seedInitialPolicy();
  }

  private seedInitialPolicy(): void {
    const now = new Date().toISOString();
    const seed: TravelPolicyRecord = {
      id: 'pol_standard_01',
      corporateId: 'corp_acme_default_01',
      name: 'Standard Policy',
      code: 'POL001',
      policyType: 'STANDARD',
      description: 'Standard corporate travel policy for all employees.',
      applicableTo: 'ALL_EMPLOYEES',
      status: 'ACTIVE',
      currentStep: 5,
      completedSteps: [1, 2, 3, 4, 5],
      travelRules: defaultTravelRules(),
      spendingLimits: defaultSpendingLimits(),
      approvalWorkflow: defaultApprovalWorkflow(),
      assignment: {
        ...defaultAssignment(),
        totalEmployees: 8450,
        reviewed: true,
      },
      createdBy: 'Richard',
      updatedBy: 'Richard',
      createdAt: now,
      updatedAt: now,
    };
    seed.travelRules.flights.preferredAirlines = ['Emirates', 'Qatar Airways', 'IndiGo'];
    seed.travelRules.flights.restrictedAirlines = ['SpiceJet', 'Go First'];
    this.memoryStore.set(seed.id, seed);
  }

  private buildRecord(id: string, input: CreateTravelPolicyDto, now: string): TravelPolicyRecord {
    return {
      id,
      corporateId: input.corporateId ?? null,
      name: input.name,
      code: input.code.toUpperCase(),
      policyType: input.policyType ?? 'STANDARD',
      description: input.description ?? '',
      applicableTo: input.applicableTo ?? 'ALL_EMPLOYEES',
      status: input.status ?? 'DRAFT',
      currentStep: 1,
      completedSteps: [1],
      travelRules: input.travelRules ?? defaultTravelRules(),
      spendingLimits: input.spendingLimits ?? defaultSpendingLimits(),
      approvalWorkflow: input.approvalWorkflow ?? defaultApprovalWorkflow(),
      assignment: input.assignment ?? defaultAssignment(),
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async create(input: CreateTravelPolicyDto): Promise<TravelPolicyRecord> {
    const id = `pol_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const record = this.buildRecord(id, input, now);
    this.memoryStore.set(record.id, record);

    if (this.prisma) {
      try {
        await this.prisma.travelPolicy.create({
          data: this.toPrismaData(record),
        });
      } catch {
        // Fallback to memory
      }
    }

    await this.enqueue('travel_policy.created', record);
    return record;
  }

  async findAll(query?: TravelPolicyQueryDto): Promise<{
    items: TravelPolicyRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (this.prisma) {
      try {
        const where: Prisma.TravelPolicyWhereInput = {};
        if (query?.status) where.status = query.status;
        if (query?.policyType) where.policyType = query.policyType;
        if (query?.applicableTo) where.applicableTo = query.applicableTo;
        if (query?.corporateId) where.corporateId = query.corporateId;
        if (query?.search) {
          where.OR = [
            { name: { contains: query.search } },
            { code: { contains: query.search } },
            { description: { contains: query.search } },
          ];
        }

        const [rows, total] = await Promise.all([
          this.prisma.travelPolicy.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.travelPolicy.count({ where }),
        ]);

        if (rows.length > 0 || total === 0) {
          const items = rows.flatMap((row) => {
            try {
              return [this.mapFromPrisma(row)];
            } catch {
              return [];
            }
          });
          return {
            items,
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
    if (query?.policyType) {
      all = all.filter((item) => item.policyType === query.policyType);
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
          item.code.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search),
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

  async findById(id: string): Promise<TravelPolicyRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.travelPolicy.findUnique({ where: { id } });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async findByCode(code: string): Promise<TravelPolicyRecord | null> {
    const normalized = code.trim().toUpperCase();
    if (this.prisma) {
      try {
        const row = await this.prisma.travelPolicy.findUnique({
          where: { code: normalized },
        });
        if (row) return this.mapFromPrisma(row);
      } catch {
        // Fallback
      }
    }
    return Array.from(this.memoryStore.values()).find((item) => item.code === normalized) ?? null;
  }

  async update(
    id: string,
    input: UpdateTravelPolicyDto,
    options?: { step?: number; publish?: boolean },
  ): Promise<TravelPolicyRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const step = options?.step;
    const completedSteps =
      step !== undefined
        ? markStepCompleted(existing.completedSteps, step)
        : existing.completedSteps;

    const updated: TravelPolicyRecord = {
      ...existing,
      corporateId: input.corporateId !== undefined ? input.corporateId : existing.corporateId,
      name: input.name ?? existing.name,
      code: input.code ? input.code.toUpperCase() : existing.code,
      policyType: input.policyType ?? existing.policyType,
      description: input.description !== undefined ? input.description : existing.description,
      applicableTo: input.applicableTo ?? existing.applicableTo,
      status: options?.publish ? 'ACTIVE' : (input.status ?? existing.status),
      currentStep: step ?? existing.currentStep,
      completedSteps,
      travelRules: input.travelRules
        ? {
            ...existing.travelRules,
            ...input.travelRules,
            flights: {
              ...existing.travelRules.flights,
              ...(input.travelRules.flights ?? {}),
            },
            hotels: {
              ...existing.travelRules.hotels,
              ...(input.travelRules.hotels ?? {}),
            },
            groundTransport: {
              ...existing.travelRules.groundTransport,
              ...(input.travelRules.groundTransport ?? {}),
            },
            trains: {
              ...existing.travelRules.trains,
              ...(input.travelRules.trains ?? {}),
            },
            bus: {
              ...existing.travelRules.bus,
              ...(input.travelRules.bus ?? {}),
            },
            otherServices: {
              ...existing.travelRules.otherServices,
              ...(input.travelRules.otherServices ?? {}),
            },
          }
        : existing.travelRules,
      spendingLimits: input.spendingLimits
        ? { ...existing.spendingLimits, ...input.spendingLimits }
        : existing.spendingLimits,
      approvalWorkflow: input.approvalWorkflow
        ? { ...existing.approvalWorkflow, ...input.approvalWorkflow }
        : existing.approvalWorkflow,
      assignment: input.assignment
        ? { ...existing.assignment, ...input.assignment }
        : existing.assignment,
      updatedBy: input.updatedBy !== undefined ? input.updatedBy : existing.updatedBy,
      updatedAt: new Date().toISOString(),
    };

    // When full travelRules/spending/etc provided as complete objects from step save,
    // prefer exact replacement for those step payloads.
    if (input.travelRules && step === 2) {
      updated.travelRules = {
        ...defaultTravelRules(),
        ...input.travelRules,
        flights: {
          ...defaultTravelRules().flights,
          ...(input.travelRules.flights ?? {}),
        },
        hotels: {
          ...defaultTravelRules().hotels,
          ...(input.travelRules.hotels ?? {}),
        },
        groundTransport: {
          ...defaultTravelRules().groundTransport,
          ...(input.travelRules.groundTransport ?? {}),
        },
        trains: {
          ...defaultTravelRules().trains,
          ...(input.travelRules.trains ?? {}),
        },
        bus: {
          ...defaultTravelRules().bus,
          ...(input.travelRules.bus ?? {}),
        },
        otherServices: {
          ...defaultTravelRules().otherServices,
          ...(input.travelRules.otherServices ?? {}),
        },
      };
    }
    if (input.spendingLimits && step === 3) {
      updated.spendingLimits = {
        ...defaultSpendingLimits(),
        ...input.spendingLimits,
      };
    }
    if (input.approvalWorkflow && step === 4) {
      updated.approvalWorkflow = {
        ...defaultApprovalWorkflow(),
        ...input.approvalWorkflow,
      };
    }
    if (input.assignment && step === 5) {
      updated.assignment = { ...defaultAssignment(), ...input.assignment };
    }

    this.memoryStore.set(id, updated);

    if (this.prisma) {
      try {
        await this.prisma.travelPolicy.update({
          where: { id },
          data: this.toPrismaData(updated),
        });
      } catch {
        // Fallback
      }
    }

    await this.enqueue('travel_policy.updated', updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    this.memoryStore.delete(id);

    if (this.prisma) {
      try {
        await this.prisma.travelPolicy.delete({ where: { id } });
      } catch {
        // Fallback
      }
    }

    await this.enqueue('travel_policy.deleted', existing);
    return true;
  }

  private toPrismaData(record: TravelPolicyRecord): Prisma.TravelPolicyCreateInput {
    return {
      id: record.id,
      corporateId: record.corporateId,
      name: record.name,
      code: record.code,
      policyType: record.policyType,
      description: record.description || null,
      applicableTo: record.applicableTo,
      status: record.status,
      currentStep: record.currentStep,
      completedSteps: record.completedSteps as unknown as Prisma.InputJsonValue,
      travelRules: record.travelRules as unknown as Prisma.InputJsonValue,
      spendingLimits: record.spendingLimits as unknown as Prisma.InputJsonValue,
      approvalWorkflow: record.approvalWorkflow as unknown as Prisma.InputJsonValue,
      assignment: record.assignment as unknown as Prisma.InputJsonValue,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    };
  }

  private mapFromPrisma(row: {
    id: string;
    corporateId: string | null;
    name: string;
    code: string;
    policyType: string;
    description: string | null;
    applicableTo: string;
    status: string;
    currentStep: number;
    completedSteps: Prisma.JsonValue | null;
    travelRules: Prisma.JsonValue | null;
    spendingLimits: Prisma.JsonValue | null;
    approvalWorkflow: Prisma.JsonValue | null;
    assignment: Prisma.JsonValue | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TravelPolicyRecord {
    return {
      id: row.id,
      corporateId: row.corporateId,
      name: row.name,
      code: row.code,
      policyType: row.policyType as TravelPolicyRecord['policyType'],
      description: row.description ?? '',
      applicableTo: row.applicableTo as TravelPolicyRecord['applicableTo'],
      status: row.status as TravelPolicyRecord['status'],
      currentStep: row.currentStep,
      completedSteps: Array.isArray(row.completedSteps) ? (row.completedSteps as number[]) : [],
      travelRules: mergeTravelRules(row.travelRules),
      spendingLimits: row.spendingLimits
        ? {
            ...defaultSpendingLimits(),
            ...(row.spendingLimits as object),
          }
        : defaultSpendingLimits(),
      approvalWorkflow: row.approvalWorkflow
        ? {
            ...defaultApprovalWorkflow(),
            ...(row.approvalWorkflow as object),
          }
        : defaultApprovalWorkflow(),
      assignment: row.assignment
        ? {
            ...defaultAssignment(),
            ...(row.assignment as object),
          }
        : defaultAssignment(),
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async enqueue(eventType: string, record: TravelPolicyRecord): Promise<void> {
    if (!this.outbox) return;
    try {
      await this.outbox.enqueue({
        aggregateType: 'travel_policy',
        aggregateId: record.id,
        eventType,
        payload: {
          policyId: record.id,
          code: record.code,
          name: record.name,
          status: record.status,
          currentStep: record.currentStep,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
