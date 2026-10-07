import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user?: unknown }>();
    return request.user;
  },
);

export const CorporateId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: { corporateId?: string }; corporateId?: string }>();
    return request.corporateId ?? request.user?.corporateId;
  },
);

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const key = request.headers['idempotency-key'];
    return typeof key === 'string' ? key : undefined;
  },
);

export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { correlationId?: string }>();
    return request.correlationId;
  },
);
