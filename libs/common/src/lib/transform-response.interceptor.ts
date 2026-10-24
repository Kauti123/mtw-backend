import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply } from 'fastify';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SKIP_API_RESPONSE_WRAP_KEY,
  apiResponse,
  defaultSuccessMessage,
  isApiResponse,
  type ApiResponse,
} from './api-response';

/** Opt out of the common `{ statusCode, message, data }` envelope (e.g. metrics). */
export const SkipApiResponseWrap = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_API_RESPONSE_WRAP_KEY, true);

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_API_RESPONSE_WRAP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const reply = context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      map((body: unknown): ApiResponse | unknown => {
        if (body instanceof StreamableFile) {
          return body;
        }

        // Controllers that already send via @Res() leave undefined / null.
        if (body === undefined) {
          return body;
        }

        if (isApiResponse(body)) {
          return body;
        }

        const statusCode =
          typeof reply.statusCode === 'number' && reply.statusCode > 0 ? reply.statusCode : 200;

        return apiResponse(statusCode, defaultSuccessMessage(statusCode), body ?? null);
      }),
    );
  }
}
