import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import type {
  CreateRoleDto,
  RoleListResponse,
  RoleQueryDto,
  RoleRecord,
  UpdateRoleDto,
  UpdateRoleStatusDto,
} from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  health() {
    return { service: 'user-service-roles', status: 'ok' };
  }

  async createRole(input: CreateRoleDto): Promise<RoleRecord> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Role name is required');
    }
    if (!input.code?.trim()) {
      throw new BadRequestException('Role code is required');
    }

    const normalizedCode = input.code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(
        `Role with code '${normalizedCode}' already exists.`,
      );
    }

    return this.repository.create({
      ...input,
      code: normalizedCode,
    });
  }

  async listRoles(query: RoleQueryDto): Promise<RoleListResponse> {
    return this.repository.findAll(query);
  }

  async getRoleById(idOrCode: string): Promise<RoleRecord> {
    let role = await this.repository.findById(idOrCode);
    if (!role) {
      role = await this.repository.findByCode(idOrCode);
    }

    if (!role) {
      throw new NotFoundException(`Role '${idOrCode}' was not found.`);
    }

    return role;
  }

  async updateRole(id: string, input: UpdateRoleDto): Promise<RoleRecord> {
    const existing = await this.getRoleById(id);

    if (input.code) {
      const normalizedCode = input.code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await this.repository.findByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(
            `Role code '${normalizedCode}' is already taken.`,
          );
        }
      }
      input = { ...input, code: normalizedCode };
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update role '${id}'.`);
    }

    return updated;
  }

  async updateRoleStatus(
    id: string,
    dto: UpdateRoleStatusDto,
  ): Promise<RoleRecord> {
    const existing = await this.getRoleById(id);
    const updated = await this.repository.updateStatus(existing.id, dto.status);
    if (!updated) {
      throw new NotFoundException(`Failed to update status for role '${id}'.`);
    }
    return updated;
  }

  async deleteRole(
    id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getRoleById(id);
    const deleted = await this.repository.delete(existing.id);

    if (!deleted) {
      throw new NotFoundException(`Failed to delete role '${id}'.`);
    }

    return {
      success: true,
      message: `Role '${existing.name}' (${existing.code}) has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkCodeAvailability(
    code: string,
  ): Promise<{ code: string; available: boolean }> {
    const normalized = code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalized);
    return {
      code: normalized,
      available: !existing,
    };
  }
}
