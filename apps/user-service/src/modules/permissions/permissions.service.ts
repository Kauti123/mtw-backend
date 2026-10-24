import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import type {
  CreatePermissionDto,
  CreatePermissionModuleDto,
  PermissionListResponse,
  PermissionMatrixResponse,
  PermissionModuleRecord,
  PermissionQueryDto,
  PermissionRecord,
  UpdatePermissionDto,
  UpdatePermissionModuleDto,
} from './dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly repository: PermissionsRepository) {}

  health() {
    return { service: 'user-service-permissions', status: 'ok' };
  }

  async getMatrix(): Promise<PermissionMatrixResponse> {
    return this.repository.getMatrix();
  }

  async listPermissions(query: PermissionQueryDto): Promise<PermissionListResponse> {
    return this.repository.findAll(query);
  }

  async getPermissionById(idOrCode: string): Promise<PermissionRecord> {
    let permission = await this.repository.findById(idOrCode);
    if (!permission) {
      permission = await this.repository.findByCode(idOrCode);
    }
    if (!permission) {
      throw new NotFoundException(`Permission '${idOrCode}' was not found.`);
    }
    return permission;
  }

  async createPermission(input: CreatePermissionDto): Promise<PermissionRecord> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Permission name is required');
    }
    if (!input.code?.trim()) {
      throw new BadRequestException('Permission code is required');
    }
    if (!input.moduleId && !input.moduleCode) {
      throw new BadRequestException('moduleId or moduleCode is required');
    }

    const normalizedCode = input.code.trim().toLowerCase();
    const existing = await this.repository.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(`Permission with code '${normalizedCode}' already exists.`);
    }

    try {
      return await this.repository.create({
        ...input,
        code: normalizedCode,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('module not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async updatePermission(id: string, input: UpdatePermissionDto): Promise<PermissionRecord> {
    const existing = await this.getPermissionById(id);

    if (input.code) {
      const normalizedCode = input.code.trim().toLowerCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await this.repository.findByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(`Permission code '${normalizedCode}' is already taken.`);
        }
      }
      input = { ...input, code: normalizedCode };
    }

    try {
      const updated = await this.repository.update(existing.id, input);
      if (!updated) {
        throw new NotFoundException(`Failed to update permission '${id}'.`);
      }
      return updated;
    } catch (error) {
      if (error instanceof Error && error.message.includes('module not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async deletePermission(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getPermissionById(id);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Failed to delete permission '${id}'.`);
    }
    return {
      success: true,
      message: `Permission '${existing.name}' (${existing.code}) has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkCodeAvailability(code: string): Promise<{ code: string; available: boolean }> {
    const normalized = code.trim().toLowerCase();
    const existing = await this.repository.findByCode(normalized);
    return { code: normalized, available: !existing };
  }

  async createModule(input: CreatePermissionModuleDto): Promise<PermissionModuleRecord> {
    const normalizedCode = input.code.trim().toLowerCase();
    const existing = await this.repository.findModuleByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(
        `Permission module with code '${normalizedCode}' already exists.`,
      );
    }
    return this.repository.createModule({
      ...input,
      code: normalizedCode,
    });
  }

  async updateModule(
    id: string,
    input: UpdatePermissionModuleDto,
  ): Promise<PermissionModuleRecord> {
    const existing =
      (await this.repository.findModuleById(id)) ?? (await this.repository.findModuleByCode(id));
    if (!existing) {
      throw new NotFoundException(`Permission module '${id}' was not found.`);
    }

    if (input.code) {
      const normalizedCode = input.code.trim().toLowerCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await this.repository.findModuleByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(
            `Permission module code '${normalizedCode}' is already taken.`,
          );
        }
      }
      input = { ...input, code: normalizedCode };
    }

    const updated = await this.repository.updateModule(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update permission module '${id}'.`);
    }
    return updated;
  }
}
