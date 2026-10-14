import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for payment-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class PaymentsRepository {
  // TODO: inject PrismaService and implement queries
}
