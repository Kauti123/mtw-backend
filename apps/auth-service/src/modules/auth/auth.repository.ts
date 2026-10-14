import { Injectable, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '@mtw/database';

export type CorporateAuthAccount = {
  id: string;
  email: string;
  passwordHash: string;
  corporateId: string;
  corporateName: string;
  corporateCode: string;
  currency: string;
  status: string;
  displayName: string;
};

@Injectable()
export class AuthRepository {
  private readonly refreshByHash = new Map<
    string,
    { subjectId: string; expiresAt: number }
  >();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async findCorporateAccountByEmail(
    email: string,
  ): Promise<CorporateAuthAccount | null> {
    const normalized = email.trim().toLowerCase();
    if (!this.prisma) return null;

    try {
      const corporate = await this.prisma.corporate.findFirst({
        where: { email: normalized },
      });
      if (corporate?.passwordHash) {
        return {
          id: `corp_user_${corporate.id}`,
          email: corporate.email || normalized,
          passwordHash: corporate.passwordHash,
          corporateId: corporate.id,
          corporateName: corporate.legalName,
          corporateCode: corporate.code,
          currency: corporate.defaultCurrency || 'INR',
          status: corporate.status,
          displayName: corporate.legalName,
        };
      }

      const authUser = await this.prisma.authUserAccount.findUnique({
        where: { email: normalized },
      });
      if (!authUser?.passwordHash || !authUser.corporateId) return null;

      const linked = await this.prisma.corporate.findUnique({
        where: { id: authUser.corporateId },
      });
      if (!linked) return null;

      return {
        id: authUser.id,
        email: authUser.email,
        passwordHash: authUser.passwordHash,
        corporateId: linked.id,
        corporateName: linked.legalName,
        corporateCode: linked.code,
        currency: linked.defaultCurrency || 'INR',
        status:
          authUser.status === 'ACTIVE' || authUser.status === 'INVITED'
            ? linked.status
            : String(authUser.status),
        displayName: linked.legalName,
      };
    } catch {
      return null;
    }
  }

  async findCorporateAccountById(
    id: string,
  ): Promise<CorporateAuthAccount | null> {
    if (!this.prisma) return null;
    try {
      if (id.startsWith('corp_user_')) {
        const corporateId = id.replace(/^corp_user_/, '');
        const corporate = await this.prisma.corporate.findUnique({
          where: { id: corporateId },
        });
        if (!corporate?.email || !corporate.passwordHash) return null;
        return {
          id,
          email: corporate.email,
          passwordHash: corporate.passwordHash,
          corporateId: corporate.id,
          corporateName: corporate.legalName,
          corporateCode: corporate.code,
          currency: corporate.defaultCurrency || 'INR',
          status: corporate.status,
          displayName: corporate.legalName,
        };
      }

      const authUser = await this.prisma.authUserAccount.findUnique({
        where: { id },
      });
      if (!authUser?.passwordHash || !authUser.corporateId) return null;
      const linked = await this.prisma.corporate.findUnique({
        where: { id: authUser.corporateId },
      });
      if (!linked) return null;
      return {
        id: authUser.id,
        email: authUser.email,
        passwordHash: authUser.passwordHash,
        corporateId: linked.id,
        corporateName: linked.legalName,
        corporateCode: linked.code,
        currency: linked.defaultCurrency || 'INR',
        status: linked.status,
        displayName: linked.legalName,
      };
    } catch {
      return null;
    }
  }

  /**
   * AuthRefreshToken.userId FK points at AuthUserAccount. Corporate-table logins use
   * synthetic ids (`corp_user_<corporateId>`), so ensure a matching account row exists
   * (or reuse the email-linked account) before persisting refresh tokens.
   */
  private async resolveRefreshUserId(subjectId: string): Promise<string> {
    if (!this.prisma || !subjectId.startsWith('corp_user_')) return subjectId;

    const existingById = await this.prisma.authUserAccount.findUnique({
      where: { id: subjectId },
    });
    if (existingById) return subjectId;

    const corporateId = subjectId.replace(/^corp_user_/, '');
    const corporate = await this.prisma.corporate.findUnique({
      where: { id: corporateId },
    });
    if (!corporate?.email) return subjectId;

    const email = corporate.email.trim().toLowerCase();
    const existingByEmail = await this.prisma.authUserAccount.findUnique({
      where: { email },
    });
    if (existingByEmail) return existingByEmail.id;

    try {
      await this.prisma.authUserAccount.create({
        data: {
          id: subjectId,
          email,
          passwordHash: corporate.passwordHash,
          corporateId: corporate.id,
          status: 'ACTIVE',
          lastLoginAt: new Date(),
        },
      });
      return subjectId;
    } catch {
      const raced = await this.prisma.authUserAccount.findUnique({
        where: { email },
      });
      return raced?.id ?? subjectId;
    }
  }

  async storeRefreshToken(subjectId: string, refreshToken: string) {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60_000;
    let persistUserId = subjectId;

    if (this.prisma) {
      try {
        persistUserId = await this.resolveRefreshUserId(subjectId);
      } catch {
        persistUserId = subjectId;
      }
    }

    this.refreshByHash.set(hash, { subjectId: persistUserId, expiresAt });

    if (!this.prisma) return;
    try {
      await this.prisma.authRefreshToken.create({
        data: {
          id: `rt_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
          userId: persistUserId,
          tokenHash: hash,
          familyId: `fam_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
          expiresAt: new Date(expiresAt),
        },
      });
    } catch {
      // Keep in-memory fallback if persistence still fails.
    }
  }

  async consumeRefreshToken(refreshToken: string): Promise<string | null> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const memory = this.refreshByHash.get(hash);
    if (memory) {
      this.refreshByHash.delete(hash);
      if (memory.expiresAt >= Date.now()) return memory.subjectId;
    }

    if (!this.prisma) return null;
    try {
      const row = await this.prisma.authRefreshToken.findFirst({
        where: { tokenHash: hash, revokedAt: null },
      });
      if (!row || row.expiresAt.getTime() < Date.now()) return null;
      await this.prisma.authRefreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
      // Prefer synthetic corp subject when the stored auth user is the shadow row we created.
      if (row.userId.startsWith('corp_user_')) return row.userId;
      const account = await this.prisma.authUserAccount.findUnique({
        where: { id: row.userId },
      });
      if (account?.corporateId) {
        const synthetic = `corp_user_${account.corporateId}`;
        const corporate = await this.prisma.corporate.findUnique({
          where: { id: account.corporateId },
        });
        // Corporate email logins are looked up via corp_user_* when password lives on Corporate.
        if (corporate?.passwordHash) return synthetic;
      }
      return row.userId;
    } catch {
      return null;
    }
  }

  async touchCorporateLogin(account: CorporateAuthAccount) {
    if (!this.prisma) return;
    try {
      if (!account.id.startsWith('corp_user_')) {
        await this.prisma.authUserAccount.update({
          where: { id: account.id },
          data: { lastLoginAt: new Date(), status: 'ACTIVE' },
        });
      }
    } catch {
      // ignore
    }
  }
}
