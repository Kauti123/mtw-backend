import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { apiResponse, type ApiResponse } from './api-response';

function zodIssues(exception: unknown): Array<{ path: string; message: string }> | null {
  if (!exception || typeof exception !== 'object') return null;
  const err = exception as { name?: string; issues?: Array<{ path?: unknown[]; message?: string }> };
  if (err.name !== 'ZodError' || !Array.isArray(err.issues)) return null;
  return err.issues.map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.map(String).join('.') : '',
    message: issue.message || 'Invalid value',
  }));
}

/** @deprecated Prefer ApiResponse; kept for callers that still build problem objects. */
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
    let message = 'Internal Server Error';
    let data: unknown = null;

    const issues = zodIssues(exception);
    if (issues) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      data = issues;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        if (typeof obj['message'] === 'string') {
          message = obj['message'];
        } else if (Array.isArray(obj['message'])) {
          message = obj['message'].join(', ');
          data = obj['message'];
        } else {
          message = exception.message || (HttpStatus[status] ?? message);
        }
        if (obj['errors'] !== undefined) {
          data = obj['errors'];
        } else if (data === null && obj['message'] !== undefined && typeof obj['message'] !== 'string') {
          data = obj['message'];
        }
      } else {
        message = exception.message || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(exception.message, exception.stack);
    }

    const payload: ApiResponse & { correlationId?: string } = {
      ...apiResponse(status, message, data ?? []),
      ...(correlationId ? { correlationId } : {}),
    };

    void response.status(status).header('content-type', 'application/json').send(payload);
  }
}

export function problem(
  status: number,
  title: string,
  detail?: string,
  extra?: Record<string, unknown>,
): ProblemDetails {
  return {
    type: 'about:blank',
    title,
    status,
    detail,
    ...extra,
  };
}
