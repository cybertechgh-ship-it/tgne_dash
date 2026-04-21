/**
 * /api/email-digest
 * Generates and sends a daily/weekly HTML digest email.
 * Requires RESEND_API_KEY + DIGEST_EMAIL env vars.
 * Trigger via cron (Vercel cron, GitHub Actions, or manual POST).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, payments, websites, tasks, reminders } from '@/db/schema';
import { desc } from 'drizzle-orm';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const to   = body.email ?? process.env.DIGEST_EMAIL;
    if (!to) return NextResponse.json({ error: 'No recipient — set DIGEST_EMAIL in .env' }, { status: 400 });
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    const [allClients, allPayments, allWebsites, allTasks, allReminders] = await Promise.all([
      db.select().from(clients),
      db.select().from(payments).orderBy(desc(payments.createdAt)),
      db.select().from(websites),
      db.select().from(tasks),
      db.select().from(reminders),
    ]);
    const today = new Date(); today.setHours(0,0,0,0);
    const pending  = allPayments.filter(p => p.status === 'PENDING');
    const overdueTasks = allTasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < today);
    const expiringIn30 = allWebsites.filter(w => {
      if (!w.expiryDate) return false;
      const diff = new Date(w.expiryDate).getTime() - today.getTime();
      return diff >= 0 && diff < 30 * 86400000;
    });
    const unreadReminders = allReminders.filter(r => !r.isRead);
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{font-family:Inter,sans-serif;background:#f8f7ff;padding:0;margin:0}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e5f5}
.hdr{background:#6544D6;padding:28px 32px;color:#fff}
.hdr h1{margin:0;font-size:22px;font-weight:800}.hdr p{margin:6px 0 0;opacity:.7;font-size:13px}
.body{padding:28px 32px}.section{margin-bottom:24px}
.section h2{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6544D6;margin:0 0 12px}
.stat-row{display:flex;gap:12px;flex-wrap:wrap}
.stat{flex:1;min-width:120px;background:#f8f7ff;border-radius:12px;padding:14px;text-align:center;border:1px solid #e8e5f5}
.stat .num{font-size:24px;font-weight:900;color:#1a1a2e}.stat .lbl{font-size:11px;color:#888;font-weight:600;text-transform:uppercase;margin-top:4px}
.item{padding:10px 0;border-bottom:1px solid #f0eef8;font-size:13px;display:flex;justify-content:space-between;align-items:center}
.badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px}
.badge-red{background:#fee;color:#c00}.badge-amber{background:#fff8e0;color:#854f0b}.badge-green{background:#e8f7ef;color:#0f6e56}
.ftr{background:#f8f7ff;padding:18px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e5f5}
</style></head><body>
<div class="wrap">
<div class="hdr"><h1>TGNE Daily Digest</h1><p>Briefing for ${today.toDateString()}</p></div>
<div class="body">
<div class="section"><h2>Overview</h2><div class="stat-row">
<div class="stat"><div class="num">${allClients.length}</div><div class="lbl">Total Clients</div></div>
<div class="stat"><div class="num">${pending.length}</div><div class="lbl">Pending Invoices</div></div>
<div class="stat"><div class="num">${overdueTasks.length}</div><div class="lbl">Overdue Tasks</div></div>
<div class="stat"><div class="num">${expiringIn30.length}</div><div class="lbl">Expiring Domains</div></div>
</div></div>
${pending.length > 0 ? `<div class="section"><h2>Pending Invoices</h2>
${pending.slice(0,5).map(p => {
  const c = allClients.find(c => c.id === p.clientId);
  const age = Math.round((today.getTime() - new Date(p.paymentDate).getTime()) / 86400000);
  return `<div class="item"><span><b>${p.invoiceNumber}</b> — ${c?.businessName ?? 'Client'}</span>
  <span>GHS ${p.amount.toLocaleString()} <span class="badge badge-amber">${age}d pending</span></span></div>`;
}).join('')}
</div>` : ''}
${expiringIn30.length > 0 ? `<div class="section"><h2>Domains Expiring Soon</h2>
${expiringIn30.slice(0,5).map(w => {
  const diff = Math.round((new Date(w.expiryDate!).getTime() - today.getTime()) / 86400000);
  return `<div class="item"><span><b>${w.domainName}</b></span>
  <span class="badge ${diff <= 7 ? 'badge-red' : 'badge-amber'}">${diff}d left</span></div>`;
}).join('')}
</div>` : ''}
${overdueTasks.length > 0 ? `<div class="section"><h2>Overdue Tasks</h2>
${overdueTasks.slice(0,5).map(t => {
  const c = allClients.find(c => c.id === t.clientId);
  return `<div class="item"><span>${t.description.slice(0,50)} — ${c?.businessName ?? ''}</span>
  <span class="badge badge-red">Overdue</span></div>`;
}).join('')}
</div>` : ''}
${unreadReminders.length > 0 ? `<div class="section"><h2>Unread Reminders (${unreadReminders.length})</h2>
${unreadReminders.slice(0,5).map(r => `<div class="item"><span>${r.title}</span>
<span class="badge badge-amber">${r.date}</span></div>`).join('')}
</div>` : ''}
</div>
<div class="ftr">TGNE Agency · Accra, Ghana · Automated Digest · Do not reply</div>
</div></body></html>`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TGNE Digest <digest@tgne.agency>', to: [to], subject: `TGNE Daily Digest — ${today.toDateString()}`, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Email send failed', details: err }, { status: 500 });
    }
    return NextResponse.json({ success: true, to, sentAt: new Date().toISOString() });
  } catch (error) {
    console.error('[POST /api/email-digest]', error);
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 });
  }
}