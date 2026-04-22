/**
 * src/app/api/test-alerts/route.ts
 *
 * POST /api/test-alerts — sends a live test email immediately via Brevo.
 * Use this to verify your BREVO_API_KEY and sender config before deployment.
 *
 * Usage:
 *   curl -X POST http://localhost:9002/api/test-alerts
 *
 * ⚠️  Remove or protect this route before sharing the deployed URL publicly.
 */

import { NextResponse } from 'next/server';
import { sendDueDateAlert } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST() {
  const today = new Date();

  const result = await sendDueDateAlert([
    {
      type:       'website',
      title:      'clientsite.com renewal',
      detail:     'WordPress · Namecheap hosting',
      daysLeft:   -2,   // overdue
      clientName: 'Kofi Brands Ltd',
      date:       new Date(today.getTime() - 2 * 86_400_000).toISOString().split('T')[0],
    },
    {
      type:       'reminder',
      title:      'Follow up on Q2 invoice',
      detail:     'Payment follow-up reminder',
      daysLeft:   3,
      clientName: 'Mensah Agency',
      date:       new Date(today.getTime() + 3 * 86_400_000).toISOString().split('T')[0],
    },
    {
      type:       'task',
      title:      'Deploy updated homepage banner',
      detail:     'Status: In Progress',
      daysLeft:   1,
      clientName: 'Accra Eats',
      date:       new Date(today.getTime() + 86_400_000).toISOString().split('T')[0],
    },
    {
      type:       'website',
      title:      'agencysite.com renewal',
      detail:     'Custom build · Cloudflare',
      daysLeft:   14,
      clientName: 'TGNE Internal',
      date:       new Date(today.getTime() + 14 * 86_400_000).toISOString().split('T')[0],
    },
  ]);

  return NextResponse.json({
    ...result,
    note: result.sent
      ? 'Test email sent via Brevo — check your inbox.'
      : 'Email not sent — check the error and your env vars.',
  });
}
