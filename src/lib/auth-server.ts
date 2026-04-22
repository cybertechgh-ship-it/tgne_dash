/**
 * src/lib/auth-server.ts
 *
 * Server-side session utilities — thin wrapper around session.ts.
 * Used by /api/auth/verify-pin to create the session cookie.
 *
 * NOTE: session.ts is the canonical implementation (used by middleware).
 * This file re-exports from session.ts so verify-pin/route.ts stays in sync.
 */

export {
  SESSION_COOKIE,
  createSessionToken as generateSessionToken,
  verifySessionToken,
  getSessionSecret,
} from '@/lib/session';
