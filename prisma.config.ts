import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Fallback so `prisma generate` works without a live DB.
    url: process.env['DATABASE_URL'] ?? 'mysql://mtw:mtw_secret@localhost:3306/mtw',
  },
});
