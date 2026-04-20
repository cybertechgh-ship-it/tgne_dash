/**
 * drizzle.config.ts
 * Drizzle Kit configuration for schema introspection and migrations.
 *
 * Usage:
 *   npx drizzle-kit generate   — generate SQL migrations
 *   npx drizzle-kit push       — push schema to DB (dev only)
 *   npx drizzle-kit studio     — open Drizzle Studio UI
 */

import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load .env so drizzle-kit CLI can read DATABASE_URL
// Load .env.local first (Next.js convention), fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    // Use DIRECT_URL for migrations (bypasses PgBouncer pooler)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
