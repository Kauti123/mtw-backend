import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for audit-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class AuditRepository {
  // TODO: inject PrismaService and implement queries
}
