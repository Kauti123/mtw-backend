import { Injectable } from '@nestjs/common';

@Injectable()
export class CMSService {
  health() {
    return { service: 'cms-service', status: 'ok' };
  }
}
