"use client";

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  Mail, Send, Clock, Calendar, CheckCircle2, AlertTriangle,
  Globe, Users, CreditCard, Settings2, Loader2, RefreshCw,
  ChevronDown, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { differenceInCalendarDays, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type DurationUnit = 'days' | 'weeks' | 'months';

interface SendResult {
  sent:       boolean;
  sentCount?: number;
  recipients?: string[];
  period?:    string;
  error?:     string;
  stats?: {
    newClients:      number;
    paidInvoices:    number;
    pendingInvoices: number;
    completedTasks:  number;
    expiringDomains: number;
  };
}

// ─── Duration selector ────────────────────────────────────────────────────────

const DURATION_PRESETS: { label: string; duration: number; unit: DurationUnit }[] = [
  { label: 'Last 24 Hours', duration: 1,  unit: 'days'   },
  { label: 'Last 7 Days',   duration: 7,  unit: 'days'   },
  { label: 'Last 2 Weeks',  duration: 2,  unit: 'weeks'  },
  { label: 'Last Month',    duration: 1,  unit: 'months' },
  { label: 'Last 3 Months', duration: 3,  unit: 'months' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data } = useApp();

  // ── Digest sender state ───────────────────────────────────────────────────
  const [duration, setDuration]     = useState(7);
  const [unit, setUnit]             = useState<DurationUnit>('days');
  const [customDuration, setCustom] = useState('');
  const [isSending, setIsSending]   = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  // ── Preview counts ────────────────────────────────────────────────────────
  const preview = useMemo(() => {
    const now    = new Date();
    const cutoff = new Date(now);
    if (unit === 'days')   cutoff.setDate(cutoff.getDate() - duration);
    if (unit === 'weeks')  cutoff.setDate(cutoff.getDate() - duration * 7);
    if (unit === 'months') cutoff.setMonth(cutoff.getMonth() - duration);
    const cutoffISO = cutoff.toISOString();

    const newClients     = data.clients.filter(c => c.createdAt >= cutoffISO).length;
    const paidInvoices   = data.payments.filter(p => p.status === 'PAID' && p.createdAt >= cutoffISO).length;
    const pendingInvoices= data.payments.filter(p => p.status === 'PENDING').length;
    const expiringDomains= data.websites.filter(w => {
      if (!w.expiryDate) return false;
      let d = 9999;
      try { d = differenceInCalendarDays(new Date(w.expiryDate.replace(' ', 'T')), now); } catch {}
      return d <= 30;
    }).length;

    return { newClients, paidInvoices, pendingInvoices, expiringDomains };
  }, [data, duration, unit]);

  const handleSend = async () => {
    setIsSending(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/send-digest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ duration, unit }),
      });
      const json = await res.json();
      setLastResult(json);
    } catch (err) {
      setLastResult({ sent: false, error: String(err) });
    } finally {
      setIsSending(false);
    }
  };

  const applyPreset = (p: typeof DURATION_PRESETS[0]) => {
    setDuration(p.duration);
    setUnit(p.unit);
    setCustom('');
    setLastResult(null);
  };

  const handleCustomDuration = (v: string) => {
    setCustom(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) setDuration(n);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Admin Settings <Settings2 className="text-primary" />
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure admin email recipients and send manual digest reports.
          </p>
        </div>

        {/* ── Admin Emails section ─────────────────────────────────────────── */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Mail size={18} className="text-primary" /> Admin Email Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-3">
                All alert emails and digest reports are sent <strong>individually</strong> to each admin —
                each gets their own separately addressed copy.
                Configure these in your <code className="text-primary font-mono text-xs">.env.local</code> file
                and in <strong>Vercel Dashboard → Settings → Environment Variables</strong>.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                  <code className="text-xs font-mono text-amber-500 whitespace-nowrap pt-0.5">NEXT_PUBLIC_ADMIN_PIN</code>
                  <span className="text-xs text-muted-foreground">
                    The admin dashboard PIN. Change from the default and set in Vercel Dashboard env vars too.
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                  <code className="text-xs font-mono text-amber-500 whitespace-nowrap pt-0.5">TGNE_ADMIN_EMAILS</code>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Comma-separated list of all three admin emails (the main variable):</p>
                    <code className="block text-primary bg-muted px-2 py-1 rounded">
                      TGNE_ADMIN_EMAILS=admin1@domain.com, admin2@domain.com, admin3@domain.com
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                  <code className="text-xs font-mono text-amber-500 whitespace-nowrap pt-0.5">TGNE_ADMIN_EMAIL</code>
                  <span className="text-xs text-muted-foreground">
                    Legacy single-email fallback (set to your first admin email — used by the cron job).
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                  <code className="text-xs font-mono text-amber-500 whitespace-nowrap pt-0.5">BREVO_SENDER_EMAIL</code>
                  <span className="text-xs text-muted-foreground">
                    Verified sender in Brevo (Settings → Senders, Domains, IPs). Must be verified or emails will bounce.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-emerald-600 font-semibold">
                Each admin receives their own individually addressed email — not a BCC or group send.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Manual Digest section ────────────────────────────────────────── */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Send size={18} className="text-primary" /> Send Agency Digest Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Presets */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      duration === p.duration && unit === p.unit
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom selector */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Custom Duration</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDuration || duration}
                    onChange={e => handleCustomDuration(e.target.value)}
                    className="w-20 h-10 px-3 bg-background rounded-lg border text-sm font-bold text-center outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex rounded-lg overflow-hidden border">
                    {(['days', 'weeks', 'months'] as DurationUnit[]).map(u => (
                      <button
                        key={u}
                        onClick={() => { setUnit(u); setLastResult(null); }}
                        className={cn(
                          'px-4 h-10 text-xs font-bold capitalize transition-all',
                          unit === u
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  = <strong className="text-foreground">Last {duration} {unit}</strong>
                </span>
              </div>
            </div>

            <Separator />

            {/* Preview counts */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Preview — What will be included
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users,       label: 'New Clients',      value: preview.newClients,      color: 'text-violet-500' },
                  { icon: CreditCard,  label: 'Paid Invoices',    value: preview.paidInvoices,    color: 'text-emerald-500' },
                  { icon: Clock,       label: 'Pending Invoices', value: preview.pendingInvoices, color: 'text-amber-500' },
                  { icon: Globe,       label: 'Expiring Domains', value: preview.expiringDomains, color: 'text-blue-500' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-muted/30 border text-center">
                    <Icon size={20} className={color} />
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 italic flex items-center gap-1">
                <Info size={11} /> Expiring domains always shows the next 30-day window regardless of period.
              </p>
            </div>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={isSending}
              size="lg"
              className="w-full gap-3 h-12 font-bold bg-gradient-to-r from-primary to-violet-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {isSending ? (
                <><Loader2 size={18} className="animate-spin" /> Sending to all admins…</>
              ) : (
                <><Send size={18} /> Send Digest — Last {duration} {unit}</>
              )}
            </Button>

            {/* Result */}
            {lastResult && (
              <div className={cn(
                'p-4 rounded-xl border text-sm',
                lastResult.sent
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700'
                  : 'bg-red-500/10 border-red-500/25 text-red-700'
              )}>
                {lastResult.sent ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 size={16} />
                      Digest sent to {lastResult.sentCount} admin{(lastResult.sentCount ?? 0) > 1 ? 's' : ''}
                    </div>
                    {lastResult.recipients && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {lastResult.recipients.map(r => (
                          <span key={r} className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 text-[10px] font-semibold border border-emerald-500/20">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}
                    {lastResult.stats && (
                      <div className="text-[11px] opacity-80 mt-1">
                        Included: {lastResult.stats.newClients} clients · {lastResult.stats.paidInvoices} paid invoices ·
                        {lastResult.stats.pendingInvoices} pending · {lastResult.stats.expiringDomains} expiring domains
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Failed to send</p>
                      <p className="text-[11px] mt-1 opacity-80">{lastResult.error}</p>
                      <p className="text-[11px] mt-1 opacity-70">
                        Check that BREVO_API_KEY, TGNE_ADMIN_EMAILS, and BREVO_SENDER_EMAIL are set in your environment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Automated Daily Digest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              In addition to manual reports, the system automatically sends a daily alert at <strong>08:00 UTC</strong>
              covering all items due within 30 days — including expiring domains, reminders, and overdue tasks.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Globe,      color: 'text-blue-500',   bg: 'bg-blue-500/10',   title: 'Domain Expiry',  desc: 'Websites expiring within 30 days, with GHS renewal amounts' },
                { icon: Clock,      color: 'text-amber-500',  bg: 'bg-amber-500/10',  title: 'Reminders',      desc: 'Scheduled alerts for domain, hosting, and payment follow-ups' },
                { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Tasks Due',  desc: 'Pending and in-progress tasks due within 7 days' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex gap-3 p-3 rounded-xl bg-muted/20 border">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
                    <Icon size={16} className={color} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
              <RefreshCw size={13} className="text-primary flex-shrink-0" />
              Auto-invoices are also generated when a website hits 30 days to expiry.
              Configured in <code className="text-primary font-mono">vercel.json</code> via cron schedule.
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
