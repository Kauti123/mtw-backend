import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { APP_CONFIG, type AppConfig } from '@mtw/config';
import type { AccessTokenClaims, AuthenticatedUser } from './jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.JWT_ACCESS_SECRET,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
  }

  validate(payload: AccessTokenClaims): AuthenticatedUser {
    if (!payload?.sub || !payload.email || !payload.typ) {
      throw new UnauthorizedException('Invalid access token payload');
    }
    if (
      payload.typ !== 'access' &&
      payload.typ !== 'admin_access' &&
      payload.typ !== 'corporate_access'
    ) {
      throw new UnauthorizedException('Invalid access token type');
    }

    return {
      id: payload.sub,
      email: payload.email,
      typ: payload.typ,
      corporateId: payload.corporateId ?? null,
      roleCode: payload.roleCode ?? null,
      role: payload.role ?? null,
      displayName: payload.displayName ?? null,
    };
  }
}
