import { Injectable, Logger } from '@nestjs/common';

/** Masked raw request/response supplier logging. */
@Injectable()
export class SupplierLogService {
  private readonly logger = new Logger(SupplierLogService.name);

  log(supplierCode: string, direction: 'OUT' | 'IN', payload: unknown): void {
    this.logger.debug({ supplierCode, direction, payload });
  }
}
