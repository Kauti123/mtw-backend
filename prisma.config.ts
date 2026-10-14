import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

function loadProjectEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function resolveDatabaseUrl(): string {
  loadProjectEnv();

  const configured = process.env['DATABASE_URL'];
  if (configured?.startsWith('mysql://')) {
    return configured;
  }

  const host = process.env['DB_HOST'];
  const port = process.env['DB_PORT'] ?? '3306';
  const user = process.env['DB_USERNAME'] ?? process.env['DB_USER'];
  const password = process.env['DB_PASSWORD'];
  const name = process.env['DB_NAME'] ?? process.env['DB_DATABASE'];
  if (host && user && password && name) {
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
  }

  // Fallback so `prisma generate` works without a live DB.
  return 'mysql://mtw:mtw_secret@localhost:3306/mtw';
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
