import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, websites, credentials, tasks, reminders, payments, auditLogs } from '@/db/schema';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const [allClients, allWebsites, allCredentials, allTasks, allReminders, allPayments, allAuditLogs] =
      await Promise.all([
        db.select().from(clients),
        db.select().from(websites),
        db.select().from(credentials),
        db.select().from(tasks),
        db.select().from(reminders),
        db.select().from(payments),
        db.select().from(auditLogs),
      ]);
    const snapshot = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      agency: 'TGNE',
      counts: {
        clients: allClients.length,
        websites: allWebsites.length,
        credentials: allCredentials.length,
        tasks: allTasks.length,
        reminders: allReminders.length,
        payments: allPayments.length,
        auditLogs: allAuditLogs.length,
      },
      data: {
        clients: allClients,
        websites: allWebsites,
        credentials: allCredentials.map(c => ({ ...c, password: '[REDACTED]' })),
        tasks: allTasks,
        reminders: allReminders,
        payments: allPayments,
        auditLogs: allAuditLogs,
      },
    };
    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="TGNE-Backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/backup]', error);
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}