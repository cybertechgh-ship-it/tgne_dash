/**
 * src/lib/auth-server.ts
 *
 * Server-side session utilities.
 * Uses Web Crypto API (crypto.subtle) — works in both Edge and Node.js runtimes.
 *
 * Strategy: the session token is HMAC-SHA256(ENCRYPTION_KEY, "tgne-admin-v1").
 * It is static per deployment (changes only when ENCRYPTION_KEY changes).
 * This is intentional: single-admin app, no user table, no expiry complexity.
 *
 * The token is stored as an httpOnly cookie so it is never accessible to JS.
 */

export const SESSION_COOKIE = 'tgne_session';
const SESSION_MESSAGE = 'tgne-admin-v1';

/**
 * Derive the session token from the ENCRYPTION_KEY.
 * Returns a hex string.
 */
export async function generateSessionToken(): Promise<string> {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY is not set');

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(SESSION_MESSAGE),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Returns true if the given token matches the expected session token.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const expected = await generateSessionToken();
    if (token.length !== expected.length) return false;
    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
