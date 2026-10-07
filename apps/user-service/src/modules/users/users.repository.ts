import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for user-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class UsersRepository {
  // TODO: inject PrismaService and implement queries
}
