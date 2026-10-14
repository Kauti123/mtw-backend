import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for booking-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class BookingsRepository {
  // TODO: inject PrismaService and implement queries
}
