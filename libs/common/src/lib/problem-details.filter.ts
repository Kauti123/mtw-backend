import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  errors?: unknown;
  [key: string]: unknown;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ??
      request.id?.toString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | undefined;
    let errors: unknown;
    let type = 'about:blank';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        detail = body;
        title = HttpStatus[status] ?? title;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        title = typeof obj['error'] === 'string' ? obj['error'] : (HttpStatus[status] ?? title);
        detail = typeof obj['message'] === 'string' ? obj['message'] : exception.message;
        errors = obj['errors'] ?? obj['message'];
        if (typeof obj['type'] === 'string') type = obj['type'];
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    const problem: ProblemDetails = {
      type,
      title,
      status,
      detail,
      instance: request.url,
      correlationId,
      ...(errors !== undefined ? { errors } : {}),
    };

    void response
      .status(status)
      .header('content-type', 'application/problem+json')
      .send(problem);
  }
}

export function problem(
  status: number,
  title: string,
  detail?: string,
  extra?: Record<string, unknown>,
): ProblemDetails {
  return { type: 'about:blank', title, status, detail, ...extra };
}
