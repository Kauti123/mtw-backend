import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for policy-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class PoliciesRepository {
  // TODO: inject PrismaService and implement queries
}
