import { Injectable } from '@nestjs/common';

/**
 * Persistence boundary for auth-service.
 * Wire to Prisma once migrations are applied.
 */
@Injectable()
export class AuthRepository {
  // TODO: inject PrismaService and implement queries
}
