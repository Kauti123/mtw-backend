import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for reporting-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class ReportsRepository {
  // TODO: inject PrismaService and implement queries
}
