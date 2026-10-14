import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import type {
  AuditLogListResponse,
  AuditLogQueryDto,
  AuditLogRecord,
  AuditLogSummary,
  CreateAuditLogDto,
} from './dto';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  health() {
    return { service: 'audit-service', status: 'ok' };
  }

  async createLog(input: CreateAuditLogDto): Promise<AuditLogRecord> {
    return this.repository.create(input);
  }

  async listLogs(query: AuditLogQueryDto): Promise<AuditLogListResponse> {
    return this.repository.findAll(query);
  }

  async getLogById(id: string): Promise<AuditLogRecord> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException(`Audit log '${id}' was not found.`);
    }
    return row;
  }

  async getSummary(): Promise<AuditLogSummary> {
    return this.repository.summary();
  }
}
