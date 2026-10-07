import { Injectable } from '@nestjs/common';

@Injectable()
export class CorporateService {
  health() {
    return { service: 'corporate-service', status: 'ok' };
  }
}
