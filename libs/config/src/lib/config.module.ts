import { Global, Module } from '@nestjs/common';
import { z } from 'zod';

const durationRegex = /^\d+(ms|s|m|h|d)$/;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEPLOY_MODE: z.enum(['monolith', 'microservices']).default('monolith'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().default('mtw-api-gateway'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),
  ADMIN_DOMAIN: z.string().default('admin.mtw.local'),
  CORPORATE_DOMAIN: z.string().default('corporate.mtw.local'),
  EMPLOYEE_DOMAIN: z.string().default('employee.mtw.local'),
  SUPPLIER_DOMAIN: z.string().default('supplier.mtw.local'),
  API_DOMAIN: z.string().default('api.mtw.local'),
  DATABASE_URL: z.string().min(1).default('mysql://mtw:mtw_secret@localhost:3306/mtw'),
  DATABASE_REPLICA_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_KEY_PREFIX: z.string().default('mtw:'),
  NATS_URL: z.string().default('nats://localhost:4222'),
  MESSAGING_TRANSPORT: z.enum(['nats', 'tcp', 'redis', 'rabbitmq', 'memory']).default('memory'),
  JWT_ACCESS_SECRET: z.string().min(32).default('dev-access-secret-min-32-characters!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev-refresh-secret-min-32-characters!'),
  JWT_ACCESS_TTL: z.string().regex(durationRegex).default('15m'),
  JWT_REFRESH_TTL: z.string().regex(durationRegex).default('7d'),
  CREDENTIAL_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().default('local'),
  AWS_SECRET_ACCESS_KEY: z.string().default('local'),
  S3_BUCKET: z.string().default('mtw-documents-local'),
  S3_ENDPOINT: z.string().optional(),
  OTEL_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),
  METRICS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

export type AppConfig = z.infer<typeof envSchema>;

export const APP_CONFIG = Symbol('APP_CONFIG');

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => loadConfig(),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
