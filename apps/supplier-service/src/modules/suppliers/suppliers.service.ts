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
import { SuppliersRepository } from './suppliers.repository';
import type {
  CreateSupplierAccountDto,
  SupplierAccountRecord,
  SupplierQueryDto,
  UpdateSupplierAccountDto,
  UpdateSupplierStatusDto,
  ValidateSupplierDto,
} from './dto';

@Injectable()
export class SupplierService {
  constructor(
    private readonly repository: SuppliersRepository,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  health() {
    return { service: 'supplier-service', status: 'ok' };
  }

  async create(input: CreateSupplierAccountDto): Promise<SupplierAccountRecord> {
    if (input.confirmPassword && input.confirmPassword !== input.password) {
      throw new BadRequestException('Password and confirm password must match.');
    }
    const code = input.supplierCode.trim().toUpperCase();
    if (await this.repository.findByCode(code)) {
      throw new ConflictException(`Supplier code '${code}' already exists.`);
    }
    if (await this.repository.findByEmail(input.email)) {
      throw new ConflictException(`Supplier email '${input.email}' is already registered.`);
    }
    const passwordHash = await this.passwords.hash(input.password);
    return this.repository.create({ ...input, supplierCode: code }, passwordHash);
  }

  list(query: SupplierQueryDto) {
    return this.repository.findAll(query);
  }

  async getById(id: string): Promise<SupplierAccountRecord> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Supplier '${id}' was not found.`);
    return this.repository.toPublic(row);
  }

  async update(id: string, input: UpdateSupplierAccountDto): Promise<SupplierAccountRecord> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Supplier '${id}' was not found.`);
    let passwordHash: string | undefined;
    if (input.password?.trim()) {
      passwordHash = await this.passwords.hash(input.password.trim());
    }
    const updated = await this.repository.update(id, {
      companyName: input.companyName?.trim() || existing.companyName,
      email: input.email?.trim().toLowerCase() || existing.email,
      contactName: input.contactName ?? existing.contactName,
      phone: input.phone ?? existing.phone,
      website: input.website ?? existing.website,
      gstNumber: input.gstNumber ?? existing.gstNumber,
      country: input.country ?? existing.country,
      city: input.city ?? existing.city,
      address: input.address ?? existing.address,
      verticals: input.verticals ?? existing.verticals,
      notes: input.notes ?? existing.notes,
      passwordHash,
    });
    if (!updated) throw new NotFoundException(`Supplier '${id}' was not found.`);
    return updated;
  }

  async validate(id: string, input: ValidateSupplierDto, actorId?: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Supplier '${id}' was not found.`);
    if (existing.status !== 'PENDING' && existing.status !== 'REJECTED') {
      throw new BadRequestException('Only pending or rejected suppliers can be validated.');
    }
    const approved = input.decision === 'APPROVE';
    const updated = await this.repository.update(id, {
      status: approved ? 'ACTIVE' : 'REJECTED',
      notes: input.notes || existing.notes,
      validatedAt: new Date().toISOString(),
      validatedBy: actorId || 'supervision',
    });
    if (!updated) throw new NotFoundException(`Supplier '${id}' was not found.`);
    return updated;
  }

  async updateStatus(id: string, input: UpdateSupplierStatusDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Supplier '${id}' was not found.`);
    const updated = await this.repository.update(id, { status: input.status });
    if (!updated) throw new NotFoundException(`Supplier '${id}' was not found.`);
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.repository.remove(id);
    if (!deleted) throw new NotFoundException(`Supplier '${id}' was not found.`);
    return { id, deleted: true };
  }

  async impersonate(id: string) {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Supplier '${id}' was not found.`);
    if (row.status !== 'ACTIVE') {
      throw new ForbiddenException('Only active, validated suppliers can be opened.');
    }
    const issued = this.accessTokens.signAccessToken({
      subject: row.id,
      email: row.email,
      typ: 'supplier_access',
      roleCode: 'SUPPLIER_ADMIN',
      role: 'Supplier Admin',
      displayName: row.contactName || row.companyName,
    });
    const refreshToken = randomBytes(32).toString('hex');
    await this.repository.update(id, { lastLoginAt: new Date().toISOString() });
    return {
      accessToken: issued.accessToken,
      refreshToken,
      tokenType: issued.tokenType,
      expiresIn: issued.expiresIn,
      user: {
        id: row.id,
        email: row.email,
        name: row.contactName || row.companyName,
        displayName: row.contactName || row.companyName,
        role: 'Supplier Admin',
        roleCode: 'SUPPLIER_ADMIN',
        supplierCode: row.supplierCode,
        supplierName: row.companyName,
      },
    };
  }

  async login(email: string, password: string) {
    const row = await this.repository.findByEmail(email);
    if (!row) throw new UnauthorizedException('Invalid credentials');
    if (row.status === 'PENDING') {
      throw new ForbiddenException(
        'Your supplier account is waiting for Misba validation. Login details are sent after approval.',
      );
    }
    if (row.status === 'REJECTED') {
      throw new ForbiddenException(
        'This supplier account was not approved. Check your email for the documents Misba requested.',
      );
    }
    if (row.status !== 'ACTIVE') {
      throw new ForbiddenException('This supplier account is not active.');
    }
    const ok = await this.passwords.verify(row.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.impersonate(row.id);
  }
}
