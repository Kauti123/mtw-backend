import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '@mtw/config';
import { Inject } from '@nestjs/common';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  kekVersion: string;
}

@Injectable()
export class AesGcmCryptoService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  encrypt(plain: string, kekVersion = 'v1'): EncryptedPayload {
    const key = Buffer.from(this.config.CREDENTIAL_ENCRYPTION_KEY, 'hex');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      kekVersion,
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const key = Buffer.from(this.config.CREDENTIAL_ENCRYPTION_KEY, 'hex');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}

export interface TenancyContext {
  corporateId: string | null;
  userId: string | null;
  portal: string | null;
  isSystem: boolean;
}

export function assertTenantScope(
  ctx: TenancyContext,
  resourceCorporateId: string,
): void {
  if (ctx.isSystem) return;
  if (!ctx.corporateId || ctx.corporateId !== resourceCorporateId) {
    throw new Error('TENANCY_VIOLATION');
  }
}

@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    const argon2 = await import('argon2');
    return argon2.hash(plain);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    const argon2 = await import('argon2');
    return argon2.verify(hash, plain);
  }
}
