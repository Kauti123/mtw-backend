import { Global, Injectable, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';
import { ConfigModule, APP_CONFIG, type AppConfig } from '@mtw/config';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly httpDuration: Histogram;
  readonly supplierCalls: Counter;
  readonly supplierErrors: Counter;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.httpDuration = new Histogram({
      name: 'mtw_http_request_duration_seconds',
      help: 'HTTP request duration',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });
    this.supplierCalls = new Counter({
      name: 'mtw_supplier_calls_total',
      help: 'Outbound supplier calls',
      labelNames: ['supplier', 'vertical', 'operation'],
      registers: [this.registry],
    });
    this.supplierErrors = new Counter({
      name: 'mtw_supplier_errors_total',
      help: 'Outbound supplier errors',
      labelNames: ['supplier', 'vertical', 'code'],
      registers: [this.registry],
    });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}

@Global()
@Module({
  imports: [
    ConfigModule,
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.LOG_LEVEL,
          transport:
            config.NODE_ENV === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'password',
              'passwordHash',
              'clientSecret',
              'ciphertext',
            ],
            remove: true,
          },
        },
      }),
    }),
  ],
  providers: [MetricsService],
  exports: [MetricsService, PinoLoggerModule],
})
export class ObservabilityModule {}
