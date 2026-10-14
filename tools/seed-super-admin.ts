import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

function loadEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
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
  loadEnv();
  const configured = process.env['DATABASE_URL'];
  if (configured?.startsWith('mysql://')) return configured;

  const host = process.env['DB_HOST'];
  const port = process.env['DB_PORT'] ?? '3306';
  const user = process.env['DB_USERNAME'] ?? process.env['DB_USER'];
  const password = process.env['DB_PASSWORD'];
  const name = process.env['DB_NAME'] ?? process.env['DB_DATABASE'];
  if (!host || !user || !password || !name) {
    throw new Error('DATABASE_URL / DB_* env vars are required');
  }
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

async function main(): Promise<void> {
  const url = resolveDatabaseUrl();
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  const email = 'admn@misbaholidays.com';
  const passwordHash = await argon2.hash('Misba@2026');

  const row = await prisma.adminUser.upsert({
    where: { email },
    create: {
      id: 'admin_super_01',
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      phone: null,
      address: 'Mumbai',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
      status: 'ACTIVE',
      mfaEnabled: false,
      mustChangePassword: false,
      isEmailVerified: true,
      passwordChangedAt: new Date(),
    },
    update: {
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      address: 'Mumbai',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      isEmailVerified: true,
      passwordChangedAt: new Date(),
    },
  });

  console.log(
    JSON.stringify(
      {
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        roleCode: row.roleCode,
        address: row.address,
        status: row.status,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
