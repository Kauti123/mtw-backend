import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AccessTokenService, PasswordService } from '@mtw/security';
import {
  AuthRepository,
  type CorporateAuthAccount,
} from './auth.repository';

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
  private readonly refreshByHash = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
    private readonly repository: AuthRepository,
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

  /** Corporate portal login using credentials created during corporate account setup. */
  async corporateLogin(email: string, password: string) {
    const account = await this.repository.findCorporateAccountByEmail(email);
    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (account.status && !['ACTIVE', 'DRAFT'].includes(account.status.toUpperCase())) {
      throw new ForbiddenException('Corporate account is not active');
    }
    const valid = await this.passwords.verify(account.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.repository.touchCorporateLogin(account);
    return this.issueCorporateTokens(account);
  }

  async corporateRefresh(refreshToken: string) {
    const subjectId =
      (await this.repository.consumeRefreshToken(refreshToken)) ||
      this.consumeDemoRefresh(refreshToken);
    if (!subjectId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const account = await this.repository.findCorporateAccountById(subjectId);
    if (!account) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (account.status && !['ACTIVE', 'DRAFT'].includes(account.status.toUpperCase())) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueCorporateTokens(account);
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

  private consumeDemoRefresh(refreshToken: string): string | null {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const row = this.refreshByHash.get(hash);
    if (!row || row.expiresAt < Date.now()) return null;
    this.refreshByHash.delete(hash);
    return row.userId;
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
        name: user.displayName,
        displayName: user.displayName,
        role: 'User',
        corporateId: user.corporateId ?? null,
      },
    };
  }

  private async issueCorporateTokens(account: CorporateAuthAccount) {
    const issued = this.accessTokens.signAccessToken({
      subject: account.id,
      email: account.email,
      typ: 'corporate_access',
      corporateId: account.corporateId,
      roleCode: 'CORPORATE_ADMIN',
      role: 'Corporate Admin',
      displayName: account.displayName,
    });

    const refreshToken = randomBytes(32).toString('hex');
    await this.repository.storeRefreshToken(account.id, refreshToken);
    this.refreshByHash.set(
      createHash('sha256').update(refreshToken).digest('hex'),
      {
        userId: account.id,
        expiresAt: Date.now() + 7 * 24 * 60 * 60_000,
      },
    );

    return {
      accessToken: issued.accessToken,
      refreshToken,
      tokenType: issued.tokenType,
      expiresIn: issued.expiresIn,
      user: {
        id: account.id,
        email: account.email,
        name: account.displayName,
        role: 'Corporate Admin',
        roleCode: 'CORPORATE_ADMIN',
        corporateId: account.corporateId,
        corporateName: account.corporateName,
        corporateCode: account.corporateCode,
        currency: account.currency,
      },
    };
  }
}
