import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for trip-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class TripsRepository {
  // TODO: inject PrismaService and implement queries
}
