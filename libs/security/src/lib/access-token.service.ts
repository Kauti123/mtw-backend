import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { APP_CONFIG, type AppConfig } from '@mtw/config';
import { durationToSeconds } from './jwt.util';
import type { AccessTokenClaims, IssueAccessTokenInput, IssuedAccessToken } from './jwt.types';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  signAccessToken(input: IssueAccessTokenInput): IssuedAccessToken {
    const expiresIn = durationToSeconds(this.config.JWT_ACCESS_TTL);
    const payload: AccessTokenClaims = {
      sub: input.subject,
      email: input.email,
      typ: input.typ,
      corporateId: input.corporateId ?? null,
      roleCode: input.roleCode,
      role: input.role,
      displayName: input.displayName,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.JWT_ACCESS_SECRET,
      expiresIn,
      algorithm: 'HS256',
      issuer: this.config.JWT_ISSUER,
      audience: this.config.JWT_AUDIENCE,
    });

    return {
      accessToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }
}
