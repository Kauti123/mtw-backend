import { Injectable } from '@nestjs/common';

@Injectable()
export class CostService {
  health() {
    return { service: 'cost-service', status: 'ok' };
  }
}
