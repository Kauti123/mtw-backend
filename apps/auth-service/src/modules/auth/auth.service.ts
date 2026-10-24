import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AccessTokenService, PasswordService } from '@mtw/security';

interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  corporateId?: string;
  displayName: string;
}

@Injectable()
export class AuthService {
  /** In-memory demo store until Prisma migrations are applied in Phase 2 runtime. */
  private readonly users = new Map<string, DemoUser>();
  private readonly refreshByHash = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  health() {
    return { service: 'auth-service', status: 'ok' };
  }

  async register(input: {
    email: string;
    password: string;
    displayName: string;
    corporateId?: string;
  }) {
    if (this.users.has(input.email.toLowerCase())) {
      throw new UnauthorizedException('Email already registered');
    }
    const user: DemoUser = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      passwordHash: await this.passwords.hash(input.password),
      corporateId: input.corporateId,
      displayName: input.displayName,
    };
    this.users.set(user.email, user);
    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = this.users.get(email.toLowerCase());
    if (!user || !(await this.passwords.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  refresh(refreshToken: string) {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const row = this.refreshByHash.get(hash);
    if (!row || row.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = [...this.users.values()].find((u) => u.id === row.userId);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    this.refreshByHash.delete(hash);
    return this.issueTokens(user);
  }

  private issueTokens(user: DemoUser) {
    const issued = this.accessTokens.signAccessToken({
      subject: user.id,
      email: user.email,
      typ: 'access',
      corporateId: user.corporateId ?? null,
      displayName: user.displayName,
    });

    const refreshToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    this.refreshByHash.set(hash, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60_000,
    });

    return {
      accessToken: issued.accessToken,
      refreshToken,
      tokenType: issued.tokenType,
      expiresIn: issued.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        corporateId: user.corporateId ?? null,
      },
    };
  }
}
