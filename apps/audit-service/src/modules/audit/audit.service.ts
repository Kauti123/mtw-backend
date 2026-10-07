import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  health() {
    return { service: 'audit-service', status: 'ok' };
  }
}
