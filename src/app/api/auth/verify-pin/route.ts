/**
 * src/app/api/auth/verify-pin/route.ts
 *
 * POST  /api/auth/verify-pin
 * Verifies the admin PIN server-side and sets a signed session cookie.
 * The PIN is NEVER read by the client — it lives only in process.env.ADMIN_PIN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSessionToken, SESSION_COOKIE } from '@/lib/auth-server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body as { pin?: string };

    if (typeof pin !== 'string' || pin.length === 0) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      console.error('[verify-pin] ADMIN_PIN env var is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Artificial delay — slows brute-force to ~2 attempts/sec regardless of outcome
    await new Promise((r) => setTimeout(r, 500));

    if (pin !== adminPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = await generateSessionToken();

    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
