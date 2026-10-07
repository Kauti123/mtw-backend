import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportingService {
  health() {
    return { service: 'reporting-service', status: 'ok' };
  }
}
