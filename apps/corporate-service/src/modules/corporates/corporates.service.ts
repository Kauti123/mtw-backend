import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CorporateRepository } from './corporates.repository';
import type {
  CorporateRecord,
  CreateCorporateDto,
  UpdateCorporateDto,
  CorporateQueryDto,
  UpdateCorporateStatusDto,
  CorporateListResponse,
} from './dto';

@Injectable()
export class CorporateService {
  constructor(private readonly repository: CorporateRepository) {}

  health() {
    return { service: 'corporate-service', status: 'ok' };
  }

  async createCorporate(input: CreateCorporateDto): Promise<CorporateRecord> {
    if (!input.companyName || input.companyName.trim().length === 0) {
      throw new BadRequestException('Company name is required');
    }
    if (!input.corporateCode || input.corporateCode.trim().length === 0) {
      throw new BadRequestException('Corporate code is required');
    }

    const normalizedCode = input.corporateCode.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(
        `Corporate account with code '${normalizedCode}' already exists.`,
      );
    }

    if (input.primaryAdmin?.workEmail) {
      const existingEmail = await this.repository.findByEmail(input.primaryAdmin.workEmail);
      if (existingEmail) {
        throw new ConflictException(
          `Primary administrator email '${input.primaryAdmin.workEmail}' is already assigned.`,
        );
      }
    }

    return this.repository.create({
      ...input,
      corporateCode: normalizedCode,
    });
  }

  async listCorporates(query: CorporateQueryDto): Promise<CorporateListResponse> {
    return this.repository.findAll(query);
  }

  async getCorporateById(idOrCode: string): Promise<CorporateRecord> {
    let corporate = await this.repository.findById(idOrCode);
    if (!corporate) {
      corporate = await this.repository.findByCode(idOrCode);
    }

    if (!corporate) {
      throw new NotFoundException(`Corporate account '${idOrCode}' was not found.`);
    }

    return corporate;
  }

  async updateCorporate(id: string, input: UpdateCorporateDto): Promise<CorporateRecord> {
    const existing = await this.getCorporateById(id);

    if (input.corporateCode) {
      const normalizedCode = input.corporateCode.trim().toUpperCase();
      if (normalizedCode !== existing.corporateCode) {
        const duplicate = await this.repository.findByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(`Corporate code '${normalizedCode}' is already taken.`);
        }
      }
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update corporate account '${id}'.`);
    }

    return updated;
  }

  async updateCorporateStatus(id: string, dto: UpdateCorporateStatusDto): Promise<CorporateRecord> {
    const existing = await this.getCorporateById(id);
    const updated = await this.repository.updateStatus(existing.id, dto.status);
    if (!updated) {
      throw new NotFoundException(`Failed to update status for corporate '${id}'.`);
    }
    return updated;
  }

  async deleteCorporate(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getCorporateById(id);
    const deleted = await this.repository.delete(existing.id);

    if (!deleted) {
      throw new NotFoundException(`Failed to delete corporate account '${id}'.`);
    }

    return {
      success: true,
      message: `Corporate account '${existing.companyName}' (${existing.corporateCode}) has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkCodeAvailability(code: string): Promise<{ code: string; available: boolean }> {
    const normalized = code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalized);
    return {
      code: normalized,
      available: !existing,
    };
  }
}
