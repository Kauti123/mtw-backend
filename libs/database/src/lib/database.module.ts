import { Global, Injectable, Module, type DynamicModule, Optional } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Prisma, PrismaClient } from '@prisma/client';
import { APP_CONFIG, type AppConfig } from '@mtw/config';

function createAdapter(url: string): PrismaMariaDb {
  try {
    return new PrismaMariaDb(url);
  } catch {
    // Fallback to discrete connection fields if URL ctor is unavailable.
    const parsed = new URL(url);
    return new PrismaMariaDb({
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '') || undefined,
      connectionLimit: 5,
    });
  }
}

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly enabled: boolean;

  constructor(@Optional() config?: AppConfig) {
    const url = config?.DATABASE_URL ?? process.env['DATABASE_URL'];
    if (url) {
      super({
        adapter: createAdapter(url),
        log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['error'],
      });
      this.enabled = true;
    } else {
      // Optional in local/dev without MySQL — construct with a dummy adapter URL.
      // Methods that hit the DB will fail softly via try/catch callers.
      super({
        adapter: createAdapter('mysql://mtw:mtw_secret@127.0.0.1:3306/mtw'),
        log: ['error'],
      });
      this.enabled = false;
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.$connect();
    } catch {
      // Optional in local/dev without MySQL
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enabled) return;
    await this.$disconnect();
  }
}

@Injectable()
export class OutboxService {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async enqueue(input: {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    headers?: Record<string, unknown>;
  }): Promise<string> {
    if (!this.prisma) {
      return `memory-${Date.now()}`;
    }
    try {
      const row = await this.prisma.outboxEvent.create({
        data: {
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          eventType: input.eventType,
          payload: input.payload as Prisma.InputJsonValue,
          headers: (input.headers ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
      return row.id;
    } catch {
      return `memory-${Date.now()}`;
    }
  }
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(_options?: { optional?: boolean }): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        {
          provide: PrismaService,
          inject: [{ token: APP_CONFIG, optional: true }],
          useFactory: (config?: AppConfig) => new PrismaService(config),
        },
        OutboxService,
      ],
      exports: [PrismaService, OutboxService],
    };
  }
}
