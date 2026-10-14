import { Injectable, Optional } from '@nestjs/common';
import { type HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '@mtw/cache';
import { PrismaService } from '@mtw/database';

@Injectable()
export class HealthService {
  constructor(
    @Optional() private readonly redis?: RedisService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async isAlive(): Promise<HealthIndicatorResult> {
    return { api: { status: 'up' } };
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    if (!this.redis) {
      return { redis: { status: 'up', optional: true } };
    }
    try {
      const pong = await this.redis.ping();
      return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          message: error instanceof Error ? error.message : 'unknown',
        },
      };
    }
  }

  async checkDatabase(): Promise<HealthIndicatorResult> {
    if (!this.prisma) {
      return { database: { status: 'up', optional: true } };
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (error) {
      return {
        database: {
          status: 'down',
          message: error instanceof Error ? error.message : 'unknown',
        },
      };
    }
  }
}
