import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_CONFIG, ConfigModule, type AppConfig } from '@mtw/config';
import { AccessTokenService } from './access-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { AesGcmCryptoService, PasswordService } from './security';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.JWT_ACCESS_SECRET,
        signOptions: {
          algorithm: 'HS256',
          issuer: config.JWT_ISSUER,
          audience: config.JWT_AUDIENCE,
          expiresIn: config.JWT_ACCESS_TTL,
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: config.JWT_ISSUER,
          audience: config.JWT_AUDIENCE,
        },
      }),
    }),
  ],
  providers: [
    AesGcmCryptoService,
    PasswordService,
    AccessTokenService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [
    AesGcmCryptoService,
    PasswordService,
    AccessTokenService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
  ],
})
export class SecurityModule {}
