import { Injectable } from '@nestjs/common';

/** Redis cache-aside for search results (TTL per vertical). */
@Injectable()
export class SearchCacheService {
  async get(_key: string): Promise<unknown | null> {
    return null;
  }

  async set(_key: string, _value: unknown, _ttlSeconds: number): Promise<void> {
    // TODO: Redis SETEX
  }
}
