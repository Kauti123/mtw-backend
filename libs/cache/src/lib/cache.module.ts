import {
  Global,
  Injectable,
  Module,
  type DynamicModule,
  type OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';
import { APP_CONFIG, type AppConfig } from '@mtw/config';
import { createHash } from 'node:crypto';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly prefix: string;
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(config: AppConfig) {
    this.prefix = config.REDIS_KEY_PREFIX;
    this.client = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableReadyCheck: true,
    });
  }

  async connect(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }

  async ping(): Promise<string> {
    await this.connect();
    return this.client.ping();
  }

  key(...parts: string[]): string {
    return `${this.prefix}${parts.join(':')}`;
  }

  async getJson<T>(key: string): Promise<T | null> {
    await this.connect();
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.connect();
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async singleFlight<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = factory().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

@Global()
@Module({})
export class CacheModule {
  static forRoot(options?: { optional?: boolean }): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      providers: [
        {
          provide: RedisService,
          inject: [{ token: APP_CONFIG, optional: true }],
          useFactory: (config?: AppConfig) => {
            if (options?.optional && !process.env['REDIS_URL'] && !config) {
              return undefined;
            }
            const resolved =
              config ??
              ({
                REDIS_URL: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
                REDIS_KEY_PREFIX: process.env['REDIS_KEY_PREFIX'] ?? 'mtw:',
              } as AppConfig);
            return new RedisService(resolved);
          },
        },
      ],
      exports: [RedisService],
    };
  }
}
