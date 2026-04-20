/**
 * src/db/index.ts
 * Neon Serverless + Drizzle ORM connection
 *
 * Uses @neondatabase/serverless HTTP transport — zero TCP sockets,
 * safe for serverless / edge runtimes, never exhausts connection pools.
 *
 * NOTE: DATABASE_URL validation is intentionally lazy (not at module level)
 * so that Next.js build does not fail when the env var is only available
 * at runtime (Vercel injects it at request time, not build time).
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// neon() creates a tagged-template SQL executor over HTTP — no persistent socket.
// We use the non-null assertion here; if DATABASE_URL is missing the driver
// will throw a clear error at the first query (request time), not at build time.
const sql = neon(process.env.DATABASE_URL!);

// drizzle wraps it with full type-safe query builder + schema inference
export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type DB = typeof db;
