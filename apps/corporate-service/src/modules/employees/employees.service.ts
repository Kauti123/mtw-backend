import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import type {
  CreateEmployeeDto,
  EmployeeListResponse,
  EmployeeQueryDto,
  EmployeeRecord,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from './dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}

  health() {
    return { service: 'corporate-service-employees', status: 'ok' };
  }

  async create(input: CreateEmployeeDto): Promise<EmployeeRecord> {
    if (!input.employeeCode?.trim()) {
      throw new BadRequestException('Employee ID is required');
    }
    if (!input.email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    const corporate = await this.repository.resolveCorporate({
      corporateId: input.corporateId,
      corporateCode: input.corporateCode,
      corporateName: input.corporateName,
    });
    if (!corporate) {
      throw new BadRequestException(
        'Corporate account is required. Provide corporateId or corporateCode.',
      );
    }

    const employeeCode = input.employeeCode.trim().toUpperCase();
    const duplicate = await this.repository.findByCode(
      corporate.id,
      employeeCode,
    );
    if (duplicate) {
      throw new ConflictException(
        `Employee ID '${employeeCode}' already exists for this corporate.`,
      );
    }

    const emailTaken = await this.repository.findByEmail(
      corporate.id,
      input.email.trim().toLowerCase(),
    );
    if (emailTaken) {
      throw new ConflictException(
        `Email '${input.email}' is already used by another employee.`,
      );
    }

    return this.repository.create({
      ...input,
      employeeCode,
      email: input.email.trim().toLowerCase(),
      corporateId: corporate.id,
      corporateCode: corporate.code,
      corporateName: corporate.name,
    });
  }

  async list(query: EmployeeQueryDto): Promise<EmployeeListResponse> {
    return this.repository.findAll(query);
  }

  async getById(id: string): Promise<EmployeeRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Employee '${id}' was not found.`);
    }
    return record;
  }

  async update(id: string, input: UpdateEmployeeDto): Promise<EmployeeRecord> {
    const existing = await this.getById(id);

    if (input.employeeCode) {
      const normalized = input.employeeCode.trim().toUpperCase();
      if (normalized !== existing.employeeCode) {
        const duplicate = await this.repository.findByCode(
          existing.corporateId,
          normalized,
        );
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(
            `Employee ID '${normalized}' is already taken.`,
          );
        }
      }
      input = { ...input, employeeCode: normalized };
    }

    if (input.email) {
      const email = input.email.trim().toLowerCase();
      if (email !== existing.email) {
        const taken = await this.repository.findByEmail(
          existing.corporateId,
          email,
        );
        if (taken && taken.id !== existing.id) {
          throw new ConflictException(`Email '${email}' is already in use.`);
        }
      }
      input = { ...input, email };
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update employee '${id}'.`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateEmployeeStatusDto,
  ): Promise<EmployeeRecord> {
    return this.update(id, { status: dto.status });
  }

  async delete(
    id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getById(id);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Failed to delete employee '${id}'.`);
    }
    const name =
      [existing.firstName, existing.lastName].filter(Boolean).join(' ') ||
      existing.email;
    return {
      success: true,
      message: `Employee '${name}' (${existing.employeeCode}) has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkCodeAvailability(
    employeeCode: string,
    corporateId?: string,
    corporateCode?: string,
  ): Promise<{ employeeCode: string; available: boolean }> {
    const normalized = employeeCode.trim().toUpperCase();
    const corporate = await this.repository.resolveCorporate({
      corporateId,
      corporateCode,
    });
    if (!corporate) {
      return { employeeCode: normalized, available: true };
    }
    const existing = await this.repository.findByCode(corporate.id, normalized);
    return { employeeCode: normalized, available: !existing };
  }

  async nextCode(corporateId?: string, corporateCode?: string) {
    const corporate = await this.repository.resolveCorporate({
      corporateId,
      corporateCode,
    });
    const employeeCode = await this.repository.nextEmployeeCode(corporate?.id);
    return { employeeCode };
  }
}
