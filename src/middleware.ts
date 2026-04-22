/**
 * src/middleware.ts
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *   1. Rate limiting  — 60 req/min per IP on all /api/ routes
 *                       5  req/min per IP on /api/auth/ (brute-force protection)
 *   2. Session check  — POST / PUT / DELETE to /api/ require a valid session cookie
 *                       GET requests are also protected (data is sensitive)
 *
 * Routes that bypass session check (they use their own auth):
 *   /api/auth/*  — login / logout
 *   /api/cron/*  — uses Bearer CRON_SECRET header
 *
 * ⚠️  Rate-limit state is in-memory (Map). On Vercel Hobby (single region) this
 *     is fine. On Pro with multiple regions, state is not shared across instances —
 *     the protection is per-instance. For shared-state rate limiting, swap the
 *     Map for @upstash/ratelimit + Redis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// ─── Rate limiting ────────────────────────────────────────────────────────────

interface RateRecord {
  count:   number;
  resetAt: number;
}

const ipMap    = new Map<string, RateRecord>(); // general API
const authMap  = new Map<string, RateRecord>(); // auth route (tighter limit)

const WINDOW_MS      = 60_000; // 1 minute
const MAX_GENERAL    = 120;    // req/min for normal API calls
const MAX_AUTH       = 10;     // req/min for login attempts
// Alert after this many hits before the hard limit (fire-and-forget)
const ALERT_THRESHOLD = 80;

function checkRateLimit(
  map: Map<string, RateRecord>,
  key: string,
  max: number
): { allowed: boolean; remaining: number; hitAlert: boolean } {
  const now = Date.now();
  let rec   = map.get(key);

  if (!rec || now > rec.resetAt) {
    rec = { count: 1, resetAt: now + WINDOW_MS };
    map.set(key, rec);
    return { allowed: true, remaining: max - 1, hitAlert: false };
  }

  rec.count++;
  const remaining = Math.max(0, max - rec.count);
  const hitAlert  = rec.count === ALERT_THRESHOLD;
  return { allowed: rec.count <= max, remaining, hitAlert };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

function rateLimitResponse(ip: string, path: string): NextResponse {
  // Fire Slack alert in background — don't await, don't block
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (webhook) {
    fetch(webhook, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text: `⚡ *Rate limit hit* — IP \`${ip}\` on \`${path}\` at ${new Date().toISOString()}`,
      }),
    }).catch(() => { /* never crash on Slack failure */ });
  }

  return NextResponse.json(
    { error: 'Too many requests — please slow down.' },
    {
      status:  429,
      headers: {
        'Retry-After':          '60',
        'X-RateLimit-Limit':    String(MAX_GENERAL),
        'X-RateLimit-Remaining':'0',
      },
    }
  );
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const ip           = getIp(req);
  const isAuth       = pathname.startsWith('/api/auth/');
  const isCron       = pathname.startsWith('/api/cron/');

  // ── 1. Rate limiting ──────────────────────────────────────────────────────
  if (isAuth) {
    const rl = checkRateLimit(authMap, ip, MAX_AUTH);
    if (!rl.allowed) return rateLimitResponse(ip, pathname);
  } else {
    const rl = checkRateLimit(ipMap, ip, MAX_GENERAL);
    if (!rl.allowed) return rateLimitResponse(ip, pathname);

    // Fire a warning alert when approaching the limit (non-blocking)
    if (rl.hitAlert) {
      const webhook = process.env.SLACK_WEBHOOK_URL;
      if (webhook) {
        fetch(webhook, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            text: `⚠️ *High request rate* — IP \`${ip}\` at ${ALERT_THRESHOLD} req/min on \`${pathname}\``,
          }),
        }).catch(() => {});
      }
    }
  }

  // ── 2. Session check (skip auth + cron routes) ────────────────────────────
  if (!isAuth && !isCron) {
    const token  = req.cookies.get(SESSION_COOKIE)?.value;
    const secret = process.env.SESSION_SECRET ?? process.env.ENCRYPTION_KEY ?? '';

    if (!secret) {
      // Misconfiguration — log to console (Edge can't use Winston)
      console.error('[middleware] SESSION_SECRET / ENCRYPTION_KEY env var is missing');
    }

    const payload = token && secret ? await verifySessionToken(token, secret) : null;

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized — please log in.' },
        { status: 401 }
      );
    }
  }

  // ── 3. Pass through — add rate-limit headers ──────────────────────────────
  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit',     String(MAX_GENERAL));
  return res;
}

export const config = {
  // Apply to all /api/* routes
  matcher: '/api/:path*',
};
