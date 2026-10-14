import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@mtw/database';
import type { CityListResponse, CityQueryDto, CityRecord } from './cities.dto';

const INDIA_CITIES: Array<{ code: string; name: string }> = [
  { code: 'DEL', name: 'Delhi, Delhi' },
  { code: 'BOM', name: 'Mumbai, Maharashtra' },
  { code: 'BLR', name: 'Bengaluru, Karnataka' },
  { code: 'HYD', name: 'Hyderabad, Telangana' },
  { code: 'MAA', name: 'Chennai, Tamil Nadu' },
  { code: 'CCU', name: 'Kolkata, West Bengal' },
  { code: 'PNQ', name: 'Pune, Maharashtra' },
  { code: 'AMD', name: 'Ahmedabad, Gujarat' },
  { code: 'JAI', name: 'Jaipur, Rajasthan' },
  { code: 'LKO', name: 'Lucknow, Uttar Pradesh' },
  { code: 'COK', name: 'Kochi, Kerala' },
  { code: 'GOI', name: 'Goa, Goa' },
  { code: 'IXC', name: 'Chandigarh, Chandigarh' },
  { code: 'NAG', name: 'Nagpur, Maharashtra' },
  { code: 'IDR', name: 'Indore, Madhya Pradesh' },
  { code: 'BBI', name: 'Bhubaneswar, Odisha' },
  { code: 'PAT', name: 'Patna, Bihar' },
  { code: 'VNS', name: 'Varanasi, Uttar Pradesh' },
  { code: 'IXB', name: 'Bagdogra, West Bengal' },
  { code: 'TRV', name: 'Thiruvananthapuram, Kerala' },
  { code: 'GAU', name: 'Guwahati, Assam' },
  { code: 'IXE', name: 'Mangaluru, Karnataka' },
  { code: 'IXM', name: 'Madurai, Tamil Nadu' },
  { code: 'CJB', name: 'Coimbatore, Tamil Nadu' },
  { code: 'IXR', name: 'Ranchi, Jharkhand' },
  { code: 'RPR', name: 'Raipur, Chhattisgarh' },
  { code: 'SXR', name: 'Srinagar, Jammu and Kashmir' },
  { code: 'IXJ', name: 'Jammu, Jammu and Kashmir' },
  { code: 'ATQ', name: 'Amritsar, Punjab' },
  { code: 'UDR', name: 'Udaipur, Rajasthan' },
  { code: 'JDH', name: 'Jodhpur, Rajasthan' },
  { code: 'IXA', name: 'Agartala, Tripura' },
  { code: 'IMF', name: 'Imphal, Manipur' },
  { code: 'SHL', name: 'Shillong, Meghalaya' },
  { code: 'AGR', name: 'Agra, Uttar Pradesh' },
  { code: 'BDQ', name: 'Vadodara, Gujarat' },
  { code: 'SUR', name: 'Surat, Gujarat' },
  { code: 'NML', name: 'Nashik, Maharashtra' },
  { code: 'MYQ', name: 'Mysuru, Karnataka' },
  { code: 'TIR', name: 'Tiruchirappalli, Tamil Nadu' },
];

@Injectable()
export class CitiesRepository {
  private readonly memory: CityRecord[] = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {
    for (const city of INDIA_CITIES) {
      this.memory.push({
        id: `city_${city.code.toLowerCase()}`,
        countryId: 'country_in',
        countryCode: 'IN',
        code: city.code,
        name: city.name,
        label: city.name,
      });
    }
  }

  async list(query: CityQueryDto): Promise<CityListResponse> {
    if (this.prisma) {
      try {
        await this.ensureSeed();
        const where: Record<string, unknown> = {};
        if (query.search?.trim()) {
          where['OR'] = [
            { name: { contains: query.search.trim() } },
            { code: { contains: query.search.trim() } },
          ];
        }
        if (query.countryCode?.trim()) {
          where['country'] = { code: query.countryCode.trim().toUpperCase() };
        }
        const total = await this.prisma.city.count({ where });
        const rows = await this.prisma.city.findMany({
          where,
          include: { country: true },
          orderBy: { name: 'asc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        const items = rows.map((row) => ({
          id: row.id,
          countryId: row.countryId,
          countryCode: row.country.code,
          code: row.code,
          name: row.name,
          label: row.name,
        }));
        return {
          items,
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        };
      } catch {
        // fall through to memory
      }
    }

    let items = [...this.memory];
    if (query.countryCode?.trim()) {
      const code = query.countryCode.trim().toUpperCase();
      items = items.filter((item) => item.countryCode === code);
    }
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q),
      );
    }
    const total = items.length;
    const start = (query.page - 1) * query.limit;
    return {
      items: items.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  private async ensureSeed() {
    if (!this.prisma) return;
    const country =
      (await this.prisma.country.findUnique({ where: { code: 'IN' } })) ??
      (await this.prisma.country.create({
        data: { id: 'country_in', code: 'IN', name: 'India' },
      }));
    const existing = await this.prisma.city.count({
      where: { countryId: country.id },
    });
    if (existing > 0) return;
    await this.prisma.city.createMany({
      data: INDIA_CITIES.map((city) => ({
        id: `city_${city.code.toLowerCase()}`,
        countryId: country.id,
        code: city.code,
        name: city.name,
      })),
      skipDuplicates: true,
    });
  }
}
