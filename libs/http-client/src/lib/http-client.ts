import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { request, type Dispatcher } from 'undici';

export interface HttpRequestOptions {
  method?: Dispatcher.HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export interface HttpResponse<T = unknown> {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: T;
  rawText: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(baseMs: number): number {
  const spread = baseMs * 0.2;
  return Math.floor(baseMs - spread + Math.random() * spread * 2);
}

@Injectable()
export class UndiciHttpClient {
  private readonly logger = new Logger(UndiciHttpClient.name);
  private readonly breakers = new Map<string, CircuitBreaker<[string, HttpRequestOptions], HttpResponse>>();

  async send<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const key = new URL(url).host;
    const breaker =
      this.breakers.get(key) ??
      new CircuitBreaker(
        async (u: string, opts: HttpRequestOptions) => this.execute<T>(u, opts),
        {
          timeout: options.timeoutMs ?? 10_000,
          errorThresholdPercentage: 50,
          resetTimeout: 30_000,
          volumeThreshold: 5,
        },
      );
    this.breakers.set(key, breaker as CircuitBreaker<[string, HttpRequestOptions], HttpResponse>);
    return breaker.fire(url, options) as Promise<HttpResponse<T>>;
  }

  private async execute<T>(url: string, options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const retries = options.retries ?? 2;
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
        try {
          const res = await request(url, {
            method: options.method ?? 'GET',
            headers: {
              'content-type': 'application/json',
              ...options.headers,
            },
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
          });
          const rawText = await res.body.text();
          let body: T;
          try {
            body = rawText ? (JSON.parse(rawText) as T) : (undefined as T);
          } catch {
            body = rawText as unknown as T;
          }
          return {
            statusCode: res.statusCode,
            headers: res.headers as Record<string, string | string[] | undefined>,
            body,
            rawText,
          };
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        lastError = error;
        const delay = jitter(100 * 2 ** attempt);
        this.logger.warn(`HTTP attempt ${attempt + 1} failed for ${url}; retry in ${delay}ms`);
        await sleep(delay);
        attempt += 1;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('HTTP request failed');
  }
}
