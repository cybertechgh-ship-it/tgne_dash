/**
 * TGNE Feature Setup Script
 * Run this once from your project root to create all new directories
 * and write files that couldn't be created by the AI tool directly.
 *
 * Usage:  node setup-features.mjs
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.cwd(); // run from C:\Users\TGNE\Desktop\tgne_dash

const dirs = [
  'src/app/api/audit',
  'src/app/api/files',
  'src/app/api/backup',
  'src/app/audit',
  'src/app/api/email-digest',
];

for (const d of dirs) {
  mkdirSync(join(BASE, d), { recursive: true });
  console.log('✓ Created:', d);
}

// ── /api/audit/route.ts ───────────────────────────────────────────────────────
writeFileSync(join(BASE, 'src/app/api/audit/route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const limit  = parseInt(searchParams.get('limit') ?? '100');
    const rows   = entity
      ? await db.select().from(auditLogs).where(eq(auditLogs.entity, entity)).orderBy(desc(auditLogs.createdAt)).limit(limit)
      : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[GET /api/audit]', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, entity, entityId, entityName, details } = body;
    if (!action || !entity || !entityId)
      return NextResponse.json({ error: 'action, entity, entityId required' }, { status: 400 });
    const [row] = await db.insert(auditLogs).values({
      action, entity, entityId,
      entityName: entityName ?? null,
      details: details ? JSON.stringify(details) : null,
      actor: 'TGNE Admin',
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[POST /api/audit]', error);
    return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 });
  }
}
`.trim());
console.log('✓ Wrote: src/app/api/audit/route.ts');

// ── /api/backup/route.ts ──────────────────────────────────────────────────────
writeFileSync(join(BASE, 'src/app/api/backup/route.ts'), `
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
        'Content-Disposition': \`attachment; filename="TGNE-Backup-\${new Date().toISOString().split('T')[0]}.json"\`,
      },
    });
  } catch (error) {
    console.error('[GET /api/backup]', error);
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}
`.trim());
console.log('✓ Wrote: src/app/api/backup/route.ts');

// ── /api/files/route.ts ───────────────────────────────────────────────────────
writeFileSync(join(BASE, 'src/app/api/files/route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const clientId = new URL(req.url).searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  const files = await db.select().from(clientFiles).where(eq(clientFiles.clientId, clientId));
  return NextResponse.json(files);
}
export async function POST(req: NextRequest) {
  try {
    const { clientId, name, base64, mimeType, size, category } = await req.json();
    if (!clientId || !name || !base64)
      return NextResponse.json({ error: 'clientId, name, base64 required' }, { status: 400 });
    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'tgne_files';
    if (!cloudName) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    const fd = new FormData();
    fd.append('file', base64);
    fd.append('upload_preset', uploadPreset);
    fd.append('folder', \`tgne/clients/\${clientId}\`);
    const cloudRes = await fetch(\`https://api.cloudinary.com/v1_1/\${cloudName}/auto/upload\`, { method: 'POST', body: fd });
    if (!cloudRes.ok) return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
    const cloud = await cloudRes.json();
    const [file] = await db.insert(clientFiles).values({
      clientId, name, url: cloud.secure_url, publicId: cloud.public_id,
      size: size ?? cloud.bytes ?? null, mimeType: mimeType ?? null, category: category ?? 'document',
    }).returning();
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('[POST /api/files]', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.delete(clientFiles).where(eq(clientFiles.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/files]', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
`.trim());
console.log('✓ Wrote: src/app/api/files/route.ts');

// ── /api/email-digest/route.ts ────────────────────────────────────────────────
writeFileSync(join(BASE, 'src/app/api/email-digest/route.ts'), `
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
    const html = \`
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
<div class="hdr"><h1>TGNE Daily Digest</h1><p>Briefing for \${today.toDateString()}</p></div>
<div class="body">
<div class="section"><h2>Overview</h2><div class="stat-row">
<div class="stat"><div class="num">\${allClients.length}</div><div class="lbl">Total Clients</div></div>
<div class="stat"><div class="num">\${pending.length}</div><div class="lbl">Pending Invoices</div></div>
<div class="stat"><div class="num">\${overdueTasks.length}</div><div class="lbl">Overdue Tasks</div></div>
<div class="stat"><div class="num">\${expiringIn30.length}</div><div class="lbl">Expiring Domains</div></div>
</div></div>
\${pending.length > 0 ? \`<div class="section"><h2>Pending Invoices</h2>
\${pending.slice(0,5).map(p => {
  const c = allClients.find(c => c.id === p.clientId);
  const age = Math.round((today.getTime() - new Date(p.paymentDate).getTime()) / 86400000);
  return \`<div class="item"><span><b>\${p.invoiceNumber}</b> — \${c?.businessName ?? 'Client'}</span>
  <span>GHS \${p.amount.toLocaleString()} <span class="badge badge-amber">\${age}d pending</span></span></div>\`;
}).join('')}
</div>\` : ''}
\${expiringIn30.length > 0 ? \`<div class="section"><h2>Domains Expiring Soon</h2>
\${expiringIn30.slice(0,5).map(w => {
  const diff = Math.round((new Date(w.expiryDate!).getTime() - today.getTime()) / 86400000);
  return \`<div class="item"><span><b>\${w.domainName}</b></span>
  <span class="badge \${diff <= 7 ? 'badge-red' : 'badge-amber'}">\${diff}d left</span></div>\`;
}).join('')}
</div>\` : ''}
\${overdueTasks.length > 0 ? \`<div class="section"><h2>Overdue Tasks</h2>
\${overdueTasks.slice(0,5).map(t => {
  const c = allClients.find(c => c.id === t.clientId);
  return \`<div class="item"><span>\${t.description.slice(0,50)} — \${c?.businessName ?? ''}</span>
  <span class="badge badge-red">Overdue</span></div>\`;
}).join('')}
</div>\` : ''}
\${unreadReminders.length > 0 ? \`<div class="section"><h2>Unread Reminders (\${unreadReminders.length})</h2>
\${unreadReminders.slice(0,5).map(r => \`<div class="item"><span>\${r.title}</span>
<span class="badge badge-amber">\${r.date}</span></div>\`).join('')}
</div>\` : ''}
</div>
<div class="ftr">TGNE Agency · Accra, Ghana · Automated Digest · Do not reply</div>
</div></body></html>\`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${resendKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TGNE Digest <digest@tgne.agency>', to: [to], subject: \`TGNE Daily Digest — \${today.toDateString()}\`, html }),
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
`.trim());
console.log('✓ Wrote: src/app/api/email-digest/route.ts');

// ── /app/audit/page.tsx ───────────────────────────────────────────────────────
writeFileSync(join(BASE, 'src/app/audit/page.tsx'), `
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Shield, Search, RefreshCw, Globe, CreditCard, CheckSquare, Clock, Users, Key, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string; action: string; entity: string; entityId: string;
  entityName: string | null; details: string | null; actor: string | null; createdAt: string;
}

const entityIcon: Record<string, React.ElementType> = {
  Client: Users, Payment: CreditCard, Task: CheckSquare, Website: Globe, Reminder: Clock, Credential: Key,
};
const actionColor: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function AuditPage() {
  const [logs, setLogs]       = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');

  const fetchLogs = async () => {
    setLoading(true);
    try { const res = await fetch('/api/audit?limit=200'); if (res.ok) setLogs(await res.json()); }
    catch { /* silent */ }
    setLoading(false);
  };
  useEffect(() => { fetchLogs(); }, []);

  const filtered = useMemo(() => logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.entity.toLowerCase().includes(q) || (l.entityName ?? '').toLowerCase().includes(q) || l.action.toLowerCase().includes(q);
    const matchFilter = filter === 'All' || l.entity === filter || l.action === filter;
    return matchSearch && matchFilter;
  }), [logs, search, filter]);

  const exportCsv = () => {
    const rows = ['Timestamp,Action,Entity,Entity Name,Actor', ...filtered.map(l =>
      [l.createdAt, l.action, l.entity, l.entityName ?? '', l.actor ?? 'TGNE Admin'].join(','))].join('\\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'TGNE-AuditLog.csv'; a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">Audit Log <Shield className="text-primary" size={28} /></h1>
            <p className="text-muted-foreground mt-1">Every add, update, and delete — fully traceable.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={exportCsv}><Download size={14} /> Export CSV</Button>
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={fetchLogs}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search logs…" className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['All','CREATE','UPDATE','DELETE','Client','Payment','Task','Website'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/40')}>
              {f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{label:'Total Events',value:logs.length,color:'text-foreground'},{label:'Creates',value:logs.filter(l=>l.action==='CREATE').length,color:'text-emerald-600'},{label:'Deletes',value:logs.filter(l=>l.action==='DELETE').length,color:'text-red-500'}].map(s => (
            <div key={s.label} className="p-4 rounded-2xl border bg-card text-center">
              <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground gap-2"><RefreshCw size={18} className="animate-spin" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2"><Shield size={28} className="opacity-20" /><p className="text-sm">No entries</p></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(log => {
                const Icon = entityIcon[log.entity] ?? Shield;
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0 mt-0.5"><Icon size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('text-[10px] font-black border px-2 py-0.5', actionColor[log.action] ?? 'bg-muted')}>{log.action}</Badge>
                        <span className="text-sm font-bold">{log.entity}</span>
                        {log.entityName && <span className="text-sm text-muted-foreground">— {log.entityName}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">by {log.actor ?? 'TGNE Admin'} · {log.entityId.slice(0,12)}…</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
`.trim());
console.log('✓ Wrote: src/app/audit/page.tsx');

console.log('\n🎉 All feature files created! Now run:\n');
console.log('  npm run db:push   ← pushes new AuditLog + ClientFile tables to Neon');
console.log('  npm run dev       ← starts dev server\n');
