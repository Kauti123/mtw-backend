import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@mtw/common';
import type { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    if (err || !user) {
      const message =
        info?.message === 'jwt expired'
          ? 'Access token has expired'
          : info?.message === 'invalid signature'
            ? 'Access token signature is invalid'
            : info?.message === 'jwt audience invalid'
              ? 'Access token audience is invalid'
              : info?.message === 'jwt issuer invalid'
                ? 'Access token issuer is invalid'
                : info?.message === 'invalid algorithm'
                  ? 'Access token algorithm is not permitted'
                  : 'Missing or invalid Bearer access token';
      throw err ?? new UnauthorizedException(message);
    }
    return user;
  }
}
