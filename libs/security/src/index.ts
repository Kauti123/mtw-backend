export {
  AesGcmCryptoService,
  PasswordService,
  assertTenantScope,
  type TenancyContext,
} from './lib/security';
export { SecurityModule } from './lib/security.module';
export { AccessTokenService } from './lib/access-token.service';
export { JwtAuthGuard } from './lib/jwt-auth.guard';
export { JwtStrategy } from './lib/jwt.strategy';
export { durationToSeconds } from './lib/jwt.util';
export type {
  AccessTokenClaims,
  AccessTokenType,
  AuthenticatedUser,
  IssueAccessTokenInput,
  IssuedAccessToken,
} from './lib/jwt.types';
