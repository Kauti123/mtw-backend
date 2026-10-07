import { Injectable } from '@nestjs/common';

@Injectable()
export class PolicyService {
  health() {
    return { service: 'policy-service', status: 'ok' };
  }
}
