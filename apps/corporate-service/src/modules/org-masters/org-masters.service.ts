import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgMastersRepository } from './org-masters.repository';
import type {
  CreateOrgMasterDto,
  OrgMasterKind,
  OrgMasterListResponse,
  OrgMasterQueryDto,
  OrgMasterRecord,
  UpdateOrgMasterDto,
} from './dto';

const LABELS: Record<OrgMasterKind, string> = {
  department: 'Department',
  position: 'Position',
  'cost-center': 'Cost center',
};

@Injectable()
export class OrgMastersService {
  constructor(private readonly repository: OrgMastersRepository) {}

  health(kind: OrgMasterKind) {
    return { service: `corporate-service-${kind}s`, status: 'ok' };
  }

  async create(kind: OrgMasterKind, input: CreateOrgMasterDto): Promise<OrgMasterRecord> {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException(`${LABELS[kind]} name is required`);

    const corporate = await this.repository.resolveCorporate({
      corporateId: input.corporateId,
      corporateCode: input.corporateCode,
    });
    if (!corporate) {
      throw new BadRequestException(
        'Corporate account is required. Provide corporateId or corporateCode.',
      );
    }

    const duplicateName = await this.repository.findByName(kind, corporate.id, name);
    if (duplicateName) {
      throw new ConflictException(
        `${LABELS[kind]} '${name}' already exists for this corporate.`,
      );
    }

    if (input.code?.trim()) {
      const duplicateCode = await this.repository.findByCode(
        kind,
        corporate.id,
        input.code.trim(),
      );
      if (duplicateCode) {
        throw new ConflictException(
          `${LABELS[kind]} code '${input.code}' already exists for this corporate.`,
        );
      }
    }

    return this.repository.create(kind, {
      ...input,
      name,
      corporateId: corporate.id,
    });
  }

  async list(
    kind: OrgMasterKind,
    query: OrgMasterQueryDto,
  ): Promise<OrgMasterListResponse> {
    if (query.corporateId || query.corporateCode) {
      const corporate = await this.repository.resolveCorporate({
        corporateId: query.corporateId,
        corporateCode: query.corporateCode,
      });
      if (corporate) {
        return this.repository.findAll(kind, {
          ...query,
          corporateId: corporate.id,
          corporateCode: undefined,
        });
      }
    }
    return this.repository.findAll(kind, query);
  }

  async getById(kind: OrgMasterKind, id: string): Promise<OrgMasterRecord> {
    const record = await this.repository.findById(kind, id);
    if (!record) {
      throw new NotFoundException(`${LABELS[kind]} '${id}' was not found.`);
    }
    return record;
  }

  async update(
    kind: OrgMasterKind,
    id: string,
    input: UpdateOrgMasterDto,
  ): Promise<OrgMasterRecord> {
    const existing = await this.getById(kind, id);

    if (input.name?.trim()) {
      const duplicate = await this.repository.findByName(
        kind,
        existing.corporateId,
        input.name.trim(),
      );
      if (duplicate && duplicate.id !== existing.id) {
        throw new ConflictException(
          `${LABELS[kind]} '${input.name}' already exists for this corporate.`,
        );
      }
    }

    if (input.code?.trim()) {
      const duplicate = await this.repository.findByCode(
        kind,
        existing.corporateId,
        input.code.trim(),
      );
      if (duplicate && duplicate.id !== existing.id) {
        throw new ConflictException(
          `${LABELS[kind]} code '${input.code}' already exists for this corporate.`,
        );
      }
    }

    const updated = await this.repository.update(kind, id, input);
    if (!updated) {
      throw new NotFoundException(`${LABELS[kind]} '${id}' was not found.`);
    }
    return updated;
  }

  async remove(kind: OrgMasterKind, id: string): Promise<{ id: string; deleted: boolean }> {
    await this.getById(kind, id);
    const deleted = await this.repository.remove(kind, id);
    return { id, deleted };
  }
}
