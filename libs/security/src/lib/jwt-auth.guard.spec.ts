import { Controller, Get, Module, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Public } from '@mtw/common';
import { APP_CONFIG, type AppConfig } from '@mtw/config';
import { AccessTokenService } from './access-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SecurityModule } from './security.module';
import { durationToSeconds } from './jwt.util';

const testConfig = {
  JWT_ACCESS_SECRET: 'test-access-secret-min-32-characters!!',
  JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-characters!',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  JWT_ISSUER: 'mtw-backend-test',
  JWT_AUDIENCE: 'mtw-api-test',
  CREDENTIAL_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
} as AppConfig;

@Controller('probe')
class ProbeController {
  @Public()
  @Get('public')
  publicRoute() {
    return { ok: true, scope: 'public' };
  }

  @Get('protected')
  protectedRoute() {
    return { ok: true, scope: 'protected' };
  }
}

@Module({
  imports: [SecurityModule],
  controllers: [ProbeController],
  providers: [
    { provide: APP_CONFIG, useValue: testConfig },
    // Ensure single guard registration for the test app
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
class ProbeModule {}

describe('JwtAuthGuard (global)', () => {
  let app: NestFastifyApplication;
  let accessTokens: AccessTokenService;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProbeModule],
    })
      .overrideProvider(APP_CONFIG)
      .useValue(testConfig)
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    accessTokens = app.get(AccessTokenService);
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  function authHeader(token: string) {
    return { authorization: `Bearer ${token}` };
  }

  it('allows approved public routes without Authorization', async () => {
    const response = await app.inject({ method: 'GET', url: '/probe/public' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, scope: 'public' });
  });

  it('rejects protected routes without Authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects malformed Bearer tokens', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: { authorization: 'Bearer not-a-jwt' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects tokens supplied via query string instead of Authorization', async () => {
    const issued = accessTokens.signAccessToken({
      subject: 'user-1',
      email: 'user@example.com',
      typ: 'access',
    });
    const response = await app.inject({
      method: 'GET',
      url: `/probe/protected?access_token=${issued.accessToken}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('allows protected routes with a valid access token', async () => {
    const issued = accessTokens.signAccessToken({
      subject: 'admin_super_01',
      email: 'admn@misbaholidays.com',
      typ: 'admin_access',
      roleCode: 'SUPER_ADMIN',
      role: 'Super Admin',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: authHeader(issued.accessToken),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, scope: 'protected' });
  });

  it('rejects expired access tokens', async () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        typ: 'access',
      },
      {
        secret: testConfig.JWT_ACCESS_SECRET,
        expiresIn: '1ms',
        algorithm: 'HS256',
        issuer: testConfig.JWT_ISSUER,
        audience: testConfig.JWT_AUDIENCE,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: authHeader(token),
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects tampered / invalidly signed tokens', async () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        typ: 'access',
      },
      {
        secret: 'wrong-secret-min-32-characters!!!!!!',
        expiresIn: durationToSeconds(testConfig.JWT_ACCESS_TTL),
        algorithm: 'HS256',
        issuer: testConfig.JWT_ISSUER,
        audience: testConfig.JWT_AUDIENCE,
      },
    );
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: authHeader(token),
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects tokens with invalid issuer', async () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        typ: 'access',
      },
      {
        secret: testConfig.JWT_ACCESS_SECRET,
        expiresIn: durationToSeconds(testConfig.JWT_ACCESS_TTL),
        algorithm: 'HS256',
        issuer: 'evil-issuer',
        audience: testConfig.JWT_AUDIENCE,
      },
    );
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: authHeader(token),
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects tokens with invalid audience', async () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        typ: 'access',
      },
      {
        secret: testConfig.JWT_ACCESS_SECRET,
        expiresIn: durationToSeconds(testConfig.JWT_ACCESS_TTL),
        algorithm: 'HS256',
        issuer: testConfig.JWT_ISSUER,
        audience: 'wrong-audience',
      },
    );
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: authHeader(token),
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects refresh-style tokens used as access tokens (invalid typ)', async () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        typ: 'refresh',
      },
      {
        secret: testConfig.JWT_ACCESS_SECRET,
        expiresIn: durationToSeconds(testConfig.JWT_ACCESS_TTL),
        algorithm: 'HS256',
        issuer: testConfig.JWT_ISSUER,
        audience: testConfig.JWT_AUDIENCE,
      },
    );
    const response = await app.inject({
      method: 'GET',
      url: '/probe/protected',
      headers: authHeader(token),
    });
    expect(response.statusCode).toBe(401);
  });

  it('protects newly added controllers by default (no @Public)', async () => {
    @Controller('new-feature')
    class NewFeatureController {
      @Get()
      list() {
        return { items: [] };
      }
    }

    @Module({
      imports: [SecurityModule],
      controllers: [NewFeatureController],
      providers: [
        { provide: APP_CONFIG, useValue: testConfig },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    })
    class NewFeatureModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [NewFeatureModule],
    })
      .overrideProvider(APP_CONFIG)
      .useValue(testConfig)
      .compile();

    const nestedApp = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await nestedApp.init();
    await nestedApp.getHttpAdapter().getInstance().ready();

    const unauth = await nestedApp.inject({ method: 'GET', url: '/new-feature' });
    expect(unauth.statusCode).toBe(401);

    const tokens = nestedApp.get(AccessTokenService).signAccessToken({
      subject: 'user-2',
      email: 'user2@example.com',
      typ: 'access',
    });
    const auth = await nestedApp.inject({
      method: 'GET',
      url: '/new-feature',
      headers: authHeader(tokens.accessToken),
    });
    expect(auth.statusCode).toBe(200);

    await nestedApp.close();
  });
});

describe('JwtAuthGuard.handleRequest', () => {
  it('throws UnauthorizedException when user is missing', () => {
    const guard = new JwtAuthGuard({
      getAllAndOverride: () => false,
    } as never);
    expect(() => guard.handleRequest(null, false, new Error('No auth token'))).toThrow(
      UnauthorizedException,
    );
  });
});

describe('durationToSeconds', () => {
  it('parses common TTL units', () => {
    expect(durationToSeconds('15m')).toBe(900);
    expect(durationToSeconds('7d')).toBe(604800);
    expect(durationToSeconds('30s')).toBe(30);
  });
});
