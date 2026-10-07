import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for masterdata-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class MasterdataRepository {
  // TODO: inject PrismaService and implement queries
}
