export interface TestEnvHandles {
  mysqlUrl?: string;
  redisUrl?: string;
}

/**
 * Testcontainers helpers. Returns undefined URLs when Docker is unavailable
 * so unit tests can skip integration suites gracefully.
 */
export async function startTestEnv(): Promise<TestEnvHandles> {
  try {
    const { MySqlContainer } = await import('@testcontainers/mysql');
    const { RedisContainer } = await import('@testcontainers/redis');
    const mysql = await new MySqlContainer('mysql:8.4')
      .withDatabase('mtw')
      .withUsername('mtw')
      .withUserPassword('mtw_secret')
      .start();
    const redis = await new RedisContainer('redis:7.4-alpine').start();
    return {
      mysqlUrl: mysql.getConnectionUrl(),
      redisUrl: redis.getConnectionUrl(),
    };
  } catch {
    return {};
  }
}

export function skipWithoutDocker(): boolean {
  return process.env['SKIP_TESTCONTAINERS'] === 'true';
}
