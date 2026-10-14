import { Injectable, NotFoundException } from '@nestjs/common';
import { CorporateGeographyRepository } from './corporate-geography.repository';
import type {
  CorporateGeographyListResponse,
  CorporateGeographyQueryDto,
  CorporateGeographyRecord,
  CreateCorporateGeographyDto,
  UpdateCorporateGeographyDto,
} from './corporate-geography.dto';

@Injectable()
export class CorporateGeographyService {
  constructor(private readonly repository: CorporateGeographyRepository) {}

  health() {
    return { service: 'corporate-geography', status: 'ok' };
  }

  list(query: CorporateGeographyQueryDto): Promise<CorporateGeographyListResponse> {
    return this.repository.list(query);
  }

  async getById(id: string): Promise<CorporateGeographyRecord> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Geography mapping '${id}' was not found.`);
    return row;
  }

  create(input: CreateCorporateGeographyDto): Promise<CorporateGeographyRecord> {
    return this.repository.create(input);
  }

  update(
    id: string,
    input: UpdateCorporateGeographyDto,
  ): Promise<CorporateGeographyRecord> {
    return this.repository.update(id, input);
  }

  async delete(id: string) {
    const ok = await this.repository.delete(id);
    if (!ok) throw new NotFoundException(`Geography mapping '${id}' was not found.`);
    return { success: true, message: 'Geography mapping deleted', id };
  }
}
