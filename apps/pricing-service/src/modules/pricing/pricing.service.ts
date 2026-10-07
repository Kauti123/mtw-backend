import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  health() {
    return { service: 'pricing-service', status: 'ok' };
  }
}
