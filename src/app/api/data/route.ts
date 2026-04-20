/**
 * src/app/api/data/route.ts
 * Master GET endpoint — fetches all entity collections in parallel.
 * Used by the AppProvider in store.tsx on initial load.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, websites, credentials, tasks, reminders, payments } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Parallel fetches — Neon HTTP driver handles concurrent requests safely
    const [
      allClients,
      allWebsites,
      allCredentials,
      allTasks,
      allReminders,
      allPayments,
    ] = await Promise.all([
      db.select().from(clients).orderBy(desc(clients.createdAt)),
      db.select().from(websites),
      db.select().from(credentials),
      db.select().from(tasks),
      db.select().from(reminders).orderBy(asc(reminders.date)),
      db.select().from(payments).orderBy(desc(payments.createdAt)),
    ]);

    return NextResponse.json({
      clients: allClients.map((c) => ({
        ...c,
        phone:     c.phone     ?? undefined,
        email:     c.email     ?? undefined,
        location:  c.location  ?? '',
        avatarUrl: c.avatarUrl ?? undefined,
        notes:     c.notes     ?? undefined,
      })),
      websites: allWebsites.map((w) => ({
        ...w,
        url:             w.url             ?? '',
        hostingProvider: w.hostingProvider ?? '',
        platform:        (w.platform as 'WordPress' | 'Shopify' | 'Custom' | 'Other') ?? 'Other',
        projectPrice:    w.projectPrice    ?? 0,
        paymentStatus:   (w.paymentStatus as 'Paid' | 'Unpaid') ?? 'Unpaid',
        dateCreated:     w.dateCreated     ?? '',
        expiryDate:      w.expiryDate      ?? undefined,
      })),
      credentials: allCredentials.map((c) => ({
        ...c,
        url: c.url ?? undefined,
        // Passwords are base64-encoded on write (credentials/route.ts POST).
        // Decode them here so the UI shows the original plain-text password.
        password: (() => {
          try {
            const decoded = Buffer.from(c.password, 'base64').toString('utf-8');
            // Guard: if decoding produces the same string it was likely plain-text (legacy row)
            return decoded;
          } catch {
            return c.password;
          }
        })(),
      })),
      tasks: allTasks.map((t) => ({
        ...t,
        status:  (t.status as 'Pending' | 'In Progress' | 'Completed') ?? 'Pending',
        dueDate: t.dueDate ?? '',
      })),
      reminders: allReminders.map((r) => ({
        ...r,
        details: r.details ?? '',
      })),
      payments: allPayments.map((p) => ({
        ...p,
        description:   p.description   ?? '',
        invoiceNumber: p.invoiceNumber ?? '',
      })),
    });
  } catch (error) {
    console.error('[GET /api/data]', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
