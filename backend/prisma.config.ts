import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Consulted only by the Prisma CLI (migrate, generate, studio) — Prisma 7
 * removed `datasource { url }` from schema.prisma in favour of this file.
 * The running app never reads this; it builds its own driver adapter in
 * `src/shared/prisma/prisma.service.ts` from the same DATABASE_URL.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
