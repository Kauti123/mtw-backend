import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for cost-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class CostRepository {
  // TODO: inject PrismaService and implement queries
}
