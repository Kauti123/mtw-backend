import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@mtw/database';
import type {
  CorporateGeographyListResponse,
  CorporateGeographyQueryDto,
  CorporateGeographyRecord,
  CreateCorporateGeographyDto,
  UpdateCorporateGeographyDto,
} from './corporate-geography.dto';

@Injectable()
export class CorporateGeographyRepository {
  private readonly memory = new Map<string, CorporateGeographyRecord>();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async list(
    query: CorporateGeographyQueryDto,
  ): Promise<CorporateGeographyListResponse> {
    if (this.prisma) {
      try {
        const where: Record<string, unknown> = {
          corporateId: query.corporateId,
        };
        if (query.status) where['status'] = query.status;
        if (query.search?.trim()) {
          const needle = query.search.trim();
          where['OR'] = [
            { country: { name: { contains: needle } } },
            { country: { code: { contains: needle } } },
            { state: { name: { contains: needle } } },
            { city: { name: { contains: needle } } },
          ];
        }
        const total = await this.prisma.corporateGeography.count({ where });
        const rows = await this.prisma.corporateGeography.findMany({
          where,
          include: {
            country: true,
            state: true,
            city: true,
          },
          orderBy: { updatedAt: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        return {
          items: rows.map((row) => this.mapRow(row)),
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
        };
      } catch {
        // fall through to memory
      }
    }

    let items = [...this.memory.values()].filter(
      (item) => item.corporateId === query.corporateId,
    );
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.search?.trim()) {
      const needle = query.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.countryName.toLowerCase().includes(needle) ||
          item.countryCode.toLowerCase().includes(needle) ||
          (item.stateName || '').toLowerCase().includes(needle) ||
          (item.cityName || '').toLowerCase().includes(needle),
      );
    }
    items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const total = items.length;
    const start = (query.page - 1) * query.limit;
    return {
      items: items.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    };
  }

  async create(
    input: CreateCorporateGeographyDto,
  ): Promise<CorporateGeographyRecord> {
    const country = await this.requireCountry(input.countryId);
    const state = input.stateId
      ? await this.requireState(input.stateId, input.countryId)
      : null;
    const city = input.cityId
      ? await this.requireCity(input.cityId, input.countryId, input.stateId)
      : null;

    if (this.prisma) {
      try {
        const existing = await this.prisma.corporateGeography.findUnique({
          where: {
            corporateId_countryId: {
              corporateId: input.corporateId,
              countryId: input.countryId,
            },
          },
        });
        if (existing) {
          throw new ConflictException(
            `Country '${country.name}' is already mapped for this corporate.`,
          );
        }
        const row = await this.prisma.corporateGeography.create({
          data: {
            id: `cgeo_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
            corporateId: input.corporateId,
            countryId: input.countryId,
            stateId: state?.id ?? null,
            cityId: city?.id ?? null,
            status: input.status ?? 'ACTIVE',
          },
          include: { country: true, state: true, city: true },
        });
        return this.mapRow(row);
      } catch (error) {
        if (error instanceof ConflictException || error instanceof NotFoundException) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : 'Failed to save corporate geography';
        if (/Unique constraint|P2002/i.test(message)) {
          throw new ConflictException(
            `Country '${country.name}' is already mapped for this corporate.`,
          );
        }
        throw new Error(`Corporate geography could not be saved: ${message}`);
      }
    }

    const duplicate = [...this.memory.values()].find(
      (item) =>
        item.corporateId === input.corporateId &&
        item.countryId === input.countryId,
    );
    if (duplicate) {
      throw new ConflictException(
        `Country '${country.name}' is already mapped for this corporate.`,
      );
    }
    const now = new Date().toISOString();
    const record: CorporateGeographyRecord = {
      id: `cgeo_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      corporateId: input.corporateId,
      countryId: country.id,
      countryCode: country.code,
      countryName: country.name,
      stateId: state?.id ?? null,
      stateCode: state?.code ?? null,
      stateName: state?.name ?? null,
      cityId: city?.id ?? null,
      cityCode: city?.code ?? null,
      cityName: city?.name ?? null,
      status: (input.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.memory.set(record.id, record);
    return record;
  }

  async update(
    id: string,
    input: UpdateCorporateGeographyDto,
  ): Promise<CorporateGeographyRecord> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException(`Geography mapping '${id}' was not found.`);

    const state =
      input.stateId === undefined
        ? undefined
        : input.stateId
          ? await this.requireState(input.stateId, existing.countryId)
          : null;
    const city =
      input.cityId === undefined
        ? undefined
        : input.cityId
          ? await this.requireCity(
              input.cityId,
              existing.countryId,
              input.stateId === undefined ? existing.stateId : input.stateId,
            )
          : null;

    if (this.prisma) {
      try {
        const row = await this.prisma.corporateGeography.update({
          where: { id },
          data: {
            ...(state !== undefined ? { stateId: state?.id ?? null } : {}),
            ...(city !== undefined ? { cityId: city?.id ?? null } : {}),
            ...(input.status ? { status: input.status } : {}),
          },
          include: { country: true, state: true, city: true },
        });
        return this.mapRow(row);
      } catch {
        // fall through
      }
    }

    const updated: CorporateGeographyRecord = {
      ...existing,
      ...(state !== undefined
        ? {
            stateId: state?.id ?? null,
            stateCode: state?.code ?? null,
            stateName: state?.name ?? null,
          }
        : {}),
      ...(city !== undefined
        ? {
            cityId: city?.id ?? null,
            cityCode: city?.code ?? null,
            cityName: city?.name ?? null,
          }
        : {}),
      ...(input.status ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.memory.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (this.prisma) {
      try {
        await this.prisma.corporateGeography.delete({ where: { id } });
        this.memory.delete(id);
        return true;
      } catch {
        // fall through
      }
    }
    return this.memory.delete(id);
  }

  async findById(id: string): Promise<CorporateGeographyRecord | null> {
    if (this.prisma) {
      try {
        const row = await this.prisma.corporateGeography.findUnique({
          where: { id },
          include: { country: true, state: true, city: true },
        });
        if (row) return this.mapRow(row);
      } catch {
        // fall through
      }
    }
    return this.memory.get(id) ?? null;
  }

  private mapRow(row: {
    id: string;
    corporateId: string;
    countryId: string;
    stateId: string | null;
    cityId: string | null;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    country: { id: string; code: string; name: string };
    state: { id: string; code: string; name: string } | null;
    city: { id: string; code: string; name: string } | null;
  }): CorporateGeographyRecord {
    return {
      id: row.id,
      corporateId: row.corporateId,
      countryId: row.countryId,
      countryCode: row.country.code,
      countryName: row.country.name,
      stateId: row.stateId,
      stateCode: row.state?.code ?? null,
      stateName: row.state?.name ?? null,
      cityId: row.cityId,
      cityCode: row.city?.code ?? null,
      cityName: row.city?.name ?? null,
      status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }

  private async requireCountry(id: string) {
    if (this.prisma) {
      const row = await this.prisma.country.findUnique({ where: { id } });
      if (row) return row;
    }
    throw new NotFoundException(`Country '${id}' was not found.`);
  }

  private async requireState(id: string, countryId: string) {
    if (this.prisma) {
      const row = await this.prisma.state.findUnique({ where: { id } });
      if (!row) throw new NotFoundException(`State '${id}' was not found.`);
      if (row.countryId !== countryId) {
        throw new ConflictException('Selected state does not belong to the country.');
      }
      return row;
    }
    throw new NotFoundException(`State '${id}' was not found.`);
  }

  private async requireCity(
    id: string,
    countryId: string,
    stateId?: string | null,
  ) {
    if (this.prisma) {
      const row = await this.prisma.city.findUnique({ where: { id } });
      if (!row) throw new NotFoundException(`City '${id}' was not found.`);
      if (row.countryId !== countryId) {
        throw new ConflictException('Selected city does not belong to the country.');
      }
      if (stateId && row.stateId && row.stateId !== stateId) {
        throw new ConflictException('Selected city does not belong to the state.');
      }
      return row;
    }
    throw new NotFoundException(`City '${id}' was not found.`);
  }
}
