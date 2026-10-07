import { loadConfig } from './lib/config.module';

describe('loadConfig', () => {
  it('loads defaults for development', () => {
    const config = loadConfig({
      JWT_ACCESS_SECRET: 'dev-access-secret-min-32-characters!!',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-min-32-characters!',
      CREDENTIAL_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });
    expect(config.DEPLOY_MODE).toBe('monolith');
    expect(config.PORT).toBe(3000);
  });
});
