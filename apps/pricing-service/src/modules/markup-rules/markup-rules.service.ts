import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarkupRulesRepository } from './markup-rules.repository';
import type {
  CreateMarkupRuleDto,
  MarkupRuleListResponse,
  MarkupRuleQueryDto,
  MarkupRuleRecord,
  UpdateMarkupRuleDto,
  UpdateMarkupRuleStatusDto,
} from './dto';

const PRODUCT_TYPES = ['FLIGHT', 'HOTEL', 'CAR', 'TRAIN', 'BUS'] as const;

@Injectable()
export class MarkupRulesService {
  constructor(private readonly repository: MarkupRulesRepository) {}

  health() {
    return { service: 'pricing-service-markup-rules', status: 'ok' };
  }

  productModules() {
    return {
      items: PRODUCT_TYPES.map((productType) => ({
        productType,
        label:
          productType.charAt(0) + productType.slice(1).toLowerCase(),
      })),
    };
  }

  async create(input: CreateMarkupRuleDto): Promise<MarkupRuleRecord> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Rule name is required');
    }
    if (!input.productType) {
      throw new BadRequestException('Product type is required');
    }
    if (input.markupValue === undefined || input.markupValue === null) {
      throw new BadRequestException('Markup value is required');
    }
    if (
      input.validFrom &&
      input.validTo &&
      new Date(input.validFrom).getTime() > new Date(input.validTo).getTime()
    ) {
      throw new BadRequestException('Valid From must be before Valid To');
    }

    return this.repository.create(input);
  }

  async list(query: MarkupRuleQueryDto): Promise<MarkupRuleListResponse> {
    return this.repository.findAll(query);
  }

  async getById(id: string): Promise<MarkupRuleRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Markup rule '${id}' was not found.`);
    }
    return record;
  }

  async update(id: string, input: UpdateMarkupRuleDto): Promise<MarkupRuleRecord> {
    const existing = await this.getById(id);
    const nextFrom = input.validFrom !== undefined ? input.validFrom : existing.validFrom;
    const nextTo = input.validTo !== undefined ? input.validTo : existing.validTo;
    if (
      nextFrom &&
      nextTo &&
      new Date(nextFrom).getTime() > new Date(nextTo).getTime()
    ) {
      throw new BadRequestException('Valid From must be before Valid To');
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update markup rule '${id}'.`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateMarkupRuleStatusDto,
  ): Promise<MarkupRuleRecord> {
    return this.update(id, { status: dto.status });
  }

  async delete(
    id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getById(id);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Failed to delete markup rule '${id}'.`);
    }
    return {
      success: true,
      message: `Markup rule '${existing.name}' has been deleted successfully.`,
      id: existing.id,
    };
  }
}
