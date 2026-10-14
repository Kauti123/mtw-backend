import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const response = http.getResponse<FastifyReply>();

    const incoming = request.headers[CORRELATION_ID_HEADER];
    const correlationId =
      typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();

    (request as FastifyRequest & { correlationId: string }).correlationId = correlationId;
    void response.header(CORRELATION_ID_HEADER, correlationId);

    return next.handle().pipe(
      tap(() => {
        void response.header(CORRELATION_ID_HEADER, correlationId);
      }),
    );
  }
}
