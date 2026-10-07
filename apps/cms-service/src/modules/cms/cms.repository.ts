import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for cms-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class CmsRepository {
  // TODO: inject PrismaService and implement queries
}
