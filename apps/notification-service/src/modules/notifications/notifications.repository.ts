import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for notification-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class NotificationsRepository {
  // TODO: inject PrismaService and implement queries
}
