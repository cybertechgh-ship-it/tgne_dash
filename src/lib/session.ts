/**
 * src/lib/session.ts
 * Lightweight HMAC-SHA256 session token helpers.
 *
 * Uses the Web Crypto API (globalThis.crypto.subtle) which is available in:
 *   - Node.js 18+  (all Vercel runtimes)
 *   - Edge runtime (Vercel Edge Network)
 *
 * Token format:  <base64url(payload)>.<base64url(HMAC-SHA256 signature)>
 *
 * Set SESSION_SECRET in .env.local / Vercel Dashboard.
 * Falls back to ENCRYPTION_KEY if SESSION_SECRET is absent.
 */

export const SESSION_COOKIE  = 'tgne_session';
export const SESSION_TTL_SEC = 8 * 60 * 60; // 8 hours

interface SessionPayload {
  sub: string;   // 'tgne-admin'
  iat: number;   // issued-at (ms)
  exp: number;   // expiry (ms)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function b64uEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64uDecode(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the session secret from env, throwing if absent. */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error('SESSION_SECRET env var is not set');
  return secret;
}

/** Creates a signed session token for the admin user. */
export async function createSessionToken(secret: string): Promise<string> {
  const payload: SessionPayload = {
    sub: 'tgne-admin',
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_SEC * 1000,
  };

  const dataPart  = b64uEncode(JSON.stringify(payload));
  const key       = await importKey(secret);
  const sigBuffer = await globalThis.crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(dataPart)
  );

  return `${dataPart}.${b64uEncode(new Uint8Array(sigBuffer))}`;
}

/** Verifies a token's signature and expiry. Returns the payload or null. */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;

    const dataPart = token.slice(0, dot);
    const sigPart  = token.slice(dot + 1);

    const key   = await importKey(secret);
    const valid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      b64uDecode(sigPart),
      new TextEncoder().encode(dataPart)
    );
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(b64uDecode(dataPart))
    );

    if (Date.now() > payload.exp) return null; // expired

    return payload;
  } catch {
    return null;
  }
}
