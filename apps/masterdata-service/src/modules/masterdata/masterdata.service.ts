import { Injectable } from '@nestjs/common';

@Injectable()
export class MasterDataService {
  health() {
    return { service: 'masterdata-service', status: 'ok' };
  }
}
