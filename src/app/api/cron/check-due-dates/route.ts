/**
 * src/app/api/cron/check-due-dates/route.ts
 *
 * Vercel Cron Job — runs daily at 08:00 UTC (= 08:00 Accra, GMT+0).
 * Configured in vercel.json at project root:
 *   { "crons": [{ "path": "/api/cron/check-due-dates", "schedule": "0 8 * * *" }] }
 *
 * Does TWO things every morning:
 *
 *  1. AUTO-INVOICE GENERATION
 *     When a website hits exactly the INVOICE_WINDOW_DAYS threshold (30d by default),
 *     a PENDING renewal invoice is auto-created in the DB — unless one already exists
 *     for that domain in the past DEDUP_WINDOW_DAYS (25d), preventing duplicates
 *     even if the cron fires slightly off-schedule.
 *
 *  2. BREVO ALERT EMAIL
 *     Sends a single digest email covering all reminders, expiring websites,
 *     and pending tasks that are due within their alert windows.
 *
 * Security: Vercel sets  Authorization: Bearer <CRON_SECRET>  automatically.
 * Add CRON_SECRET to Vercel Dashboard Environment Variables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reminders, websites, tasks, clients, payments } from '@/db/schema';
import { differenceInCalendarDays } from 'date-fns';
import { createId } from '@paralleldrive/cuid2';
import { sendDueDateAlert, DueAlert } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Tuneable constants ────────────────────────────────────────────────────────

/** Auto-generate a renewal invoice when this many days remain until expiry */
const INVOICE_WINDOW_DAYS = 30;

/**
 * Deduplication guard: if a PENDING renewal invoice for the same domain
 * was created within this many days, skip — don't create a duplicate.
 * Must be < INVOICE_WINDOW_DAYS to avoid gaps.
 */
const DEDUP_WINDOW_DAYS = 25;

/** Send alert email for reminders/sites due within this many days */
const ALERT_WINDOW_DAYS = 30;

/** Send alert email for tasks due within this many days */
const TASK_ALERT_DAYS = 7;

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Security: verify Vercel cron secret ──────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today    = new Date();
  const todayStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

  try {
    // ── Fetch all data in one parallel shot ──────────────────────────────
    const [allReminders, allWebsites, allTasks, allClients, allPayments] = await Promise.all([
      db.select().from(reminders),
      db.select().from(websites),
      db.select().from(tasks),
      db.select().from(clients),
      db.select().from(payments),
    ]);

    const clientMap = new Map(allClients.map(c => [c.id, c]));

    // ════════════════════════════════════════════════════════════════════════
    // PART 1 — AUTO-INVOICE GENERATION
    // ════════════════════════════════════════════════════════════════════════

    const autoInvoicesCreated: { domain: string; clientName: string; amount: number }[] = [];

    for (const w of allWebsites) {
      if (!w.expiryDate) continue;

      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(w.expiryDate), today); } catch { continue; }

      // Only act when the site is inside the invoice window (and not already expired)
      if (daysLeft < 0 || daysLeft > INVOICE_WINDOW_DAYS) continue;

      const client = clientMap.get(w.clientId);
      if (!client) continue;

      // ── Deduplication check ─────────────────────────────────────────────
      // Look for any PENDING invoice for this client that:
      //   a) mentions this exact domain name in the description, AND
      //   b) was created within the last DEDUP_WINDOW_DAYS days
      const dedupCutoff = new Date(today.getTime() - DEDUP_WINDOW_DAYS * 86_400_000).toISOString();

      const alreadyExists = allPayments.some(p =>
        p.clientId  === w.clientId &&
        p.status    === 'PENDING' &&
        p.createdAt >= dedupCutoff &&
        p.description?.toLowerCase().includes(w.domainName.toLowerCase())
      );

      if (alreadyExists) continue; // invoice already queued — skip

      // ── Build the invoice ───────────────────────────────────────────────
      const amount        = w.projectPrice ?? 0;
      const invoiceNumber = `REN-${w.domainName.replace(/\./g, '-').toUpperCase()}-${todayStr}`;
      const description   = `Website Renewal: ${w.domainName} (${w.platform ?? 'Website'} · ${w.hostingProvider ?? 'Hosting'}) — expires ${w.expiryDate?.split('T')[0] ?? daysLeft + 'd'}`;
      const now           = new Date().toISOString();

      // ── Insert directly via Drizzle ─────────────────────────────────────
      await db.insert(payments).values({
        id:            createId(),
        clientId:      w.clientId,
        amount,
        status:        'PENDING',
        paymentDate:   todayStr,
        description,
        invoiceNumber,
        createdAt:     now,
      });

      autoInvoicesCreated.push({
        domain:     w.domainName,
        clientName: client.businessName,
        amount,
      });

      console.log(`[cron] Auto-invoice created → ${invoiceNumber} for ${client.businessName} (${w.domainName}) — GHS ${amount}`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PART 2 — BUILD ALERT EMAIL ITEMS
    // ════════════════════════════════════════════════════════════════════════

    const clientName = (id: string) => clientMap.get(id)?.businessName ?? undefined;
    const alerts: DueAlert[] = [];

    // Reminders
    for (const r of allReminders) {
      if (!r.date) continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(r.date), today); } catch { continue; }
      if (daysLeft <= ALERT_WINDOW_DAYS) {
        alerts.push({
          type:    'reminder',
          title:   r.title,
          detail:  r.details ? r.details.slice(0, 80) : r.type,
          daysLeft,
          date:    r.date,
        });
      }
    }

    // Website expiry dates
    for (const w of allWebsites) {
      if (!w.expiryDate) continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(w.expiryDate), today); } catch { continue; }
      if (daysLeft <= ALERT_WINDOW_DAYS) {
        alerts.push({
          type:       'website',
          title:      `${w.domainName} renewal`,
          detail:     `${w.platform ?? 'Website'} · ${w.hostingProvider ?? 'Hosting provider'}`,
          daysLeft,
          clientName: clientName(w.clientId),
          date:       w.expiryDate.split('T')[0],
        });
      }
    }

    // Tasks (non-completed, tight 7-day window)
    for (const t of allTasks) {
      if (!t.dueDate || t.status === 'Completed') continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(t.dueDate), today); } catch { continue; }
      if (daysLeft <= TASK_ALERT_DAYS) {
        alerts.push({
          type:       'task',
          title:      t.description.slice(0, 70),
          detail:     `Status: ${t.status}`,
          daysLeft,
          clientName: clientName(t.clientId),
          date:       t.dueDate,
        });
      }
    }

    // Sort: overdue first, then soonest upcoming
    alerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // ── Append auto-invoice summary items to the email alert ───────────────
    // Give the admin visibility on what was auto-generated this run
    const autoInvoiceAlerts: DueAlert[] = autoInvoicesCreated.map(inv => ({
      type:       'reminder' as const,
      title:      `🧾 Auto-invoice created: ${inv.domain}`,
      detail:     `Renewal invoice of GHS ${inv.amount.toLocaleString()} queued as PENDING`,
      daysLeft:   0,
      clientName: inv.clientName,
      date:       todayStr,
    }));

    const allAlerts = [...alerts, ...autoInvoiceAlerts];

    // ── Send email ─────────────────────────────────────────────────────────
    let emailResult = { sent: false, error: 'No items to report' };

    if (allAlerts.length > 0) {
      emailResult = await sendDueDateAlert(allAlerts);
    }

    // ── Summary log ────────────────────────────────────────────────────────
    const summary = {
      checked:            today.toISOString(),
      alertCount:         alerts.length,
      autoInvoicesCreated: autoInvoicesCreated.length,
      autoInvoices:       autoInvoicesCreated,
      email:              emailResult,
    };

    console.log('[cron/check-due-dates] Run complete →', JSON.stringify(summary, null, 2));

    return NextResponse.json(summary);

  } catch (error) {
    console.error('[cron/check-due-dates] Fatal error:', error);
    try { (global as any).__rollbar?.error(error); } catch {}
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
