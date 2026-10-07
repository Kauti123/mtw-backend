import { Injectable } from '@nestjs/common';

@Injectable()
export class SupplierService {
  health() {
    return { service: 'supplier-service', status: 'ok' };
  }
}
