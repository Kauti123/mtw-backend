import { loadConfig } from './config.module';

describe('loadConfig', () => {
  it('loads defaults for development', () => {
    const config = loadConfig({
      JWT_ACCESS_SECRET: 'dev-access-secret-min-32-characters!!',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-min-32-characters!',
      CREDENTIAL_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });
    expect(config.DEPLOY_MODE).toBe('monolith');
    expect(config.PORT).toBe(3001);
    expect(config.JWT_ISSUER).toBe('mtw-backend');
    expect(config.JWT_AUDIENCE).toBe('mtw-api');
  });

  it('builds DATABASE_URL from discrete DB_* fields', () => {
    const config = loadConfig({
      JWT_ACCESS_SECRET: 'dev-access-secret-min-32-characters!!',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-min-32-characters!',
      CREDENTIAL_ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      DB_HOST: '72.60.202.206',
      DB_PORT: '3306',
      DB_USERNAME: 'trikonx',
      DB_PASSWORD: 'secret',
      DB_NAME: 'misba',
    });

    expect(config.DATABASE_URL).toBe('mysql://trikonx:secret@72.60.202.206:3306/misba');
    expect(config.DB_HOST).toBe('72.60.202.206');
    expect(config.DB_NAME).toBe('misba');
  });
});
