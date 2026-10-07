import { AesGcmCryptoService } from './security';
import type { AppConfig } from '@mtw/config';

describe('AesGcmCryptoService', () => {
  const config = {
    CREDENTIAL_ENCRYPTION_KEY:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  } as AppConfig;

  it('round-trips credentials', () => {
    const crypto = new AesGcmCryptoService(config);
    const encrypted = crypto.encrypt(JSON.stringify({ apiKey: 'secret-123' }));
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    const plain = crypto.decrypt(encrypted);
    expect(JSON.parse(plain)).toEqual({ apiKey: 'secret-123' });
  });
});
