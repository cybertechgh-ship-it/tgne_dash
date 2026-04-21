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
      [l.createdAt, l.action, l.entity, l.entityName ?? '', l.actor ?? 'TGNE Admin'].join(','))].join('\n');
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