import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@mtw/database';
import type {
  CountryListResponse,
  CountryQueryDto,
  CountryRecord,
  StateListResponse,
  StateQueryDto,
  StateRecord,
} from './countries.dto';

const SEED_COUNTRIES: CountryRecord[] = [
  { id: 'country_in', code: 'IN', name: 'India', label: 'India (IN)' },
  { id: 'country_ae', code: 'AE', name: 'United Arab Emirates', label: 'United Arab Emirates (AE)' },
  { id: 'country_us', code: 'US', name: 'United States', label: 'United States (US)' },
  { id: 'country_gb', code: 'GB', name: 'United Kingdom', label: 'United Kingdom (GB)' },
  { id: 'country_sg', code: 'SG', name: 'Singapore', label: 'Singapore (SG)' },
  { id: 'country_au', code: 'AU', name: 'Australia', label: 'Australia (AU)' },
  { id: 'country_de', code: 'DE', name: 'Germany', label: 'Germany (DE)' },
  { id: 'country_fr', code: 'FR', name: 'France', label: 'France (FR)' },
  { id: 'country_jp', code: 'JP', name: 'Japan', label: 'Japan (JP)' },
  { id: 'country_sa', code: 'SA', name: 'Saudi Arabia', label: 'Saudi Arabia (SA)' },
];

@Injectable()
export class CountriesRepository {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async listCountries(query: CountryQueryDto): Promise<CountryListResponse> {
    if (this.prisma) {
      try {
        await this.ensureCountries();
        const where: Record<string, unknown> = {};
        if (query.search?.trim()) {
          where['OR'] = [
            { name: { contains: query.search.trim() } },
            { code: { contains: query.search.trim() } },
          ];
        }
        const total = await this.prisma.country.count({ where });
        const rows = await this.prisma.country.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        return {
          items: rows.map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            label: `${row.name} (${row.code})`,
          })),
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        };
      } catch {
        // fall through
      }
    }
    return this.pageMemory(SEED_COUNTRIES, query);
  }

  async listStates(query: StateQueryDto): Promise<StateListResponse> {
    if (this.prisma) {
      try {
        const where: Record<string, unknown> = {};
        if (query.search?.trim()) {
          where['OR'] = [
            { name: { contains: query.search.trim() } },
            { code: { contains: query.search.trim() } },
          ];
        }
        if (query.countryId?.trim()) where['countryId'] = query.countryId.trim();
        if (query.countryCode?.trim()) {
          where['country'] = { code: query.countryCode.trim().toUpperCase() };
        }
        const total = await this.prisma.state.count({ where });
        const rows = await this.prisma.state.findMany({
          where,
          include: { country: true },
          orderBy: { name: 'asc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        return {
          items: rows.map((row) => ({
            id: row.id,
            countryId: row.countryId,
            countryCode: row.country.code,
            code: row.code,
            name: row.name,
            label: `${row.name} (${row.code})`,
          })),
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        };
      } catch {
        // fall through
      }
    }
    return {
      items: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 1,
    };
  }

  private pageMemory(
    all: CountryRecord[],
    query: CountryQueryDto,
  ): CountryListResponse {
    const needle = query.search?.trim().toLowerCase() || '';
    const filtered = needle
      ? all.filter(
          (item) =>
            item.name.toLowerCase().includes(needle) ||
            item.code.toLowerCase().includes(needle),
        )
      : all;
    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    return {
      items: filtered.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    };
  }

  private async ensureCountries() {
    if (!this.prisma) return;
    const count = await this.prisma.country.count();
    if (count > 0) return;
    for (const country of SEED_COUNTRIES) {
      await this.prisma.country.upsert({
        where: { code: country.code },
        create: { id: country.id, code: country.code, name: country.name },
        update: { name: country.name },
      });
    }
  }
}
