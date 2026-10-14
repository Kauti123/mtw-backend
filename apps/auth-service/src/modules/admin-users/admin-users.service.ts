import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AccessTokenService, PasswordService } from '@mtw/security';
import type { AdminAuthTokenResponse } from '@mtw/contracts';
import { AdminUsersRepository } from './admin-users.repository';
import type {
  AdminUserListResponse,
  AdminUserQueryDto,
  AdminUserRecord,
  ChangeAdminPasswordDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateAdminUserStatusDto,
} from './dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly repository: AdminUsersRepository,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  health() {
    return { service: 'auth-service-admin-users', status: 'ok' };
  }

  async login(email: string, password: string): Promise<AdminAuthTokenResponse> {
    const admin = await this.repository.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.status === 'SUSPENDED' || admin.status === 'DELETED') {
      throw new ForbiddenException('Admin account is not active');
    }

    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()) {
      throw new ForbiddenException('Admin account is temporarily locked');
    }

    const valid = await this.passwords.verify(admin.passwordHash, password);
    if (!valid) {
      await this.repository.recordLoginFailure(admin.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.repository.recordLoginSuccess(admin.id);
    return this.issueTokens(admin);
  }

  async refresh(refreshToken: string): Promise<AdminAuthTokenResponse> {
    const adminId = await this.repository.consumeRefreshToken(refreshToken);
    if (!adminId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status === 'SUSPENDED' || admin.status === 'DELETED') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(admin);
  }

  async createAdmin(input: CreateAdminUserDto): Promise<AdminUserRecord> {
    if (!input.password) {
      throw new BadRequestException('Password is required');
    }

    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException(
        `Admin user with email '${input.email}' already exists.`,
      );
    }

    return this.repository.create(input);
  }

  async listAdmins(query: AdminUserQueryDto): Promise<AdminUserListResponse> {
    return this.repository.findAll(query);
  }

  async getAdminById(id: string): Promise<AdminUserRecord> {
    const admin = await this.repository.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin user '${id}' was not found.`);
    }
    const { passwordHash: _passwordHash, ...publicRow } = admin;
    return publicRow;
  }

  async updateAdmin(
    id: string,
    input: UpdateAdminUserDto,
  ): Promise<AdminUserRecord> {
    const existing = await this.getAdminById(id);

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const duplicate = await this.repository.findByEmail(input.email);
      if (duplicate && duplicate.id !== existing.id) {
        throw new ConflictException(
          `Admin email '${input.email}' is already taken.`,
        );
      }
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update admin user '${id}'.`);
    }
    return updated;
  }

  async updateAdminStatus(
    id: string,
    dto: UpdateAdminUserStatusDto,
  ): Promise<AdminUserRecord> {
    return this.updateAdmin(id, { status: dto.status });
  }

  async changePassword(
    id: string,
    dto: ChangeAdminPasswordDto,
  ): Promise<AdminUserRecord> {
    const admin = await this.repository.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin user '${id}' was not found.`);
    }

    if (dto.currentPassword) {
      const valid = await this.passwords.verify(
        admin.passwordHash,
        dto.currentPassword,
      );
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const updated = await this.repository.update(id, {
      password: dto.newPassword,
      mustChangePassword: false,
    });
    if (!updated) {
      throw new NotFoundException(`Failed to update password for '${id}'.`);
    }
    return updated;
  }

  async deleteAdmin(
    id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getAdminById(id);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Failed to delete admin user '${id}'.`);
    }
    return {
      success: true,
      message: `Admin user '${existing.email}' has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkEmailAvailability(
    email: string,
  ): Promise<{ email: string; available: boolean }> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.repository.findByEmail(normalized);
    return { email: normalized, available: !existing };
  }

  private async issueTokens(admin: {
    id: string;
    email: string;
    displayName: string;
    roleCode: string;
    roleName: string;
    mustChangePassword: boolean;
  }): Promise<AdminAuthTokenResponse> {
    const issued = this.accessTokens.signAccessToken({
      subject: admin.id,
      email: admin.email,
      typ: 'admin_access',
      roleCode: admin.roleCode,
      role: admin.roleName,
      displayName: admin.displayName,
    });

    const refreshToken = randomBytes(32).toString('hex');
    await this.repository.storeRefreshToken(admin.id, refreshToken);

    return {
      accessToken: issued.accessToken,
      refreshToken,
      tokenType: issued.tokenType,
      expiresIn: issued.expiresIn,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.displayName,
        role: admin.roleName,
        roleCode: admin.roleCode,
        mustChangePassword: admin.mustChangePassword,
      },
    };
  }
}
