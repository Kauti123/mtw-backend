import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CorporateCodesRepository } from './corporate-codes.repository';
import type {
  CorporateCodeListResponse,
  CorporateCodeQueryDto,
  CorporateCodeRecord,
  CreateCorporateCodeDto,
  UpdateCorporateCodeDto,
  UpdateCorporateCodeStatusDto,
} from './dto';

@Injectable()
export class CorporateCodesService {
  constructor(private readonly repository: CorporateCodesRepository) {}

  health() {
    return { service: 'corporate-service-codes', status: 'ok' };
  }

  async create(input: CreateCorporateCodeDto): Promise<CorporateCodeRecord> {
    if (!input.code?.trim()) {
      throw new BadRequestException('Corporate code is required');
    }
    if (!input.name?.trim()) {
      throw new BadRequestException('Corporate name is required');
    }

    const normalizedCode = input.code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(
        `Corporate code '${normalizedCode}' already exists.`,
      );
    }

    return this.repository.create({
      ...input,
      code: normalizedCode,
    });
  }

  async list(query: CorporateCodeQueryDto): Promise<CorporateCodeListResponse> {
    return this.repository.findAll(query);
  }

  async getById(idOrCode: string): Promise<CorporateCodeRecord> {
    let record = await this.repository.findById(idOrCode);
    if (!record) {
      record = await this.repository.findByCode(idOrCode);
    }
    if (!record) {
      throw new NotFoundException(`Corporate code '${idOrCode}' was not found.`);
    }
    return record;
  }

  async update(
    id: string,
    input: UpdateCorporateCodeDto,
  ): Promise<CorporateCodeRecord> {
    const existing = await this.getById(id);

    if (input.code) {
      const normalizedCode = input.code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await this.repository.findByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(
            `Corporate code '${normalizedCode}' is already taken.`,
          );
        }
      }
      input = { ...input, code: normalizedCode };
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update corporate code '${id}'.`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateCorporateCodeStatusDto,
  ): Promise<CorporateCodeRecord> {
    return this.update(id, { status: dto.status });
  }

  async delete(
    id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getById(id);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Failed to delete corporate code '${id}'.`);
    }
    return {
      success: true,
      message: `Corporate code '${existing.name}' (${existing.code}) has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkCodeAvailability(
    code: string,
  ): Promise<{ code: string; available: boolean }> {
    const normalized = code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalized);
    return { code: normalized, available: !existing };
  }
}
