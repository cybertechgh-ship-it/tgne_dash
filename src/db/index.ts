/**
 * src/db/index.ts
 * Neon Serverless + Drizzle ORM connection
 *
 * Uses @neondatabase/serverless HTTP transport — zero TCP sockets,
 * safe for serverless / edge runtimes, never exhausts connection pools.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

// Validate at import time — fail fast with a clear message
if (!databaseUrl) {
  throw new Error(
    '[db/index.ts] DATABASE_URL environment variable is not set. ' +
    'Add it to your .env.local file (or Vercel Dashboard env vars for production). ' +
    'Get the value from: console.neon.tech → your project → Connection Details → Pooled connection.'
  );
}

// Guard against placeholder / template values left in .env.local
if (
  databaseUrl.includes('REPLACE_WITH') ||
  databaseUrl.includes('YOUR_NEON') ||
  databaseUrl === 'postgresql://REPLACE_WITH_YOUR_NEON_POOLED_CONNECTION_STRING'
) {
  throw new Error(
    '[db/index.ts] DATABASE_URL still contains a placeholder value. ' +
    'Replace it with your real Neon connection string in .env.local.'
  );
}

// neon() creates a tagged-template SQL executor over HTTP — no persistent socket.
const sql = neon(databaseUrl);

// drizzle wraps it with full type-safe query builder + schema inference
export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type DB = typeof db;
