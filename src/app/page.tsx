"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  Users, Globe, CreditCard, Calendar, TrendingUp,
  CheckSquare, Sparkles, Zap, Activity, History,
  ShieldCheck, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

// --- Types ---

type Urgency = 'overdue' | 'urgent' | 'soon' | 'ok';

interface AlertItem {
  label:     string;
  dateLabel: string;
  urgency:   Urgency;
  icon:      string;
}

// --- Global Alert Ticker ---

function GlobalAlertTicker({ items }: { items: AlertItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/30 border border-border h-11 flex items-center justify-center">
        <span className="text-xs text-muted-foreground italic flex items-center gap-2">
          <ShieldCheck size={13} className="text-emerald-500" />
          All clear — no overdue or upcoming alerts.
        </span>
      </div>
    );
  }

  const tripled = [...items, ...items, ...items];
  const duration = Math.max(20, Math.min(80, items.length * 11));

  const urgencyStyle: Record<Urgency, string> = {
    overdue: 'bg-red-500/20 text-red-500 border-red-400/40',
    urgent:  'bg-orange-500/20 text-orange-500 border-orange-400/40',
    soon:    'bg-amber-500/15 text-amber-600 border-amber-400/30',
    ok:      'bg-emerald-500/15 text-emerald-600 border-emerald-400/30',
  };
  const urgencyLabel: Record<Urgency, string> = {
    overdue: '⚡ OVERDUE',
    urgent:  '🔥 URGENT',
    soon:    '📅 SOON',
    ok:      '✓ OK',
  };

  const hasOverdue = items.some(i => i.urgency === 'overdue');
  const hasUrgent  = !hasOverdue && items.some(i => i.urgency === 'urgent');

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl h-11 border',
      hasOverdue
        ? 'bg-gradient-to-r from-red-500/12 via-background to-red-500/12 border-red-400/30'
        : hasUrgent
          ? 'bg-gradient-to-r from-orange-500/10 via-background to-orange-500/10 border-orange-400/25'
          : 'bg-gradient-to-r from-primary/8 via-accent/30 to-primary/8 border-primary/15'
    )}>
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2 pl-4 pr-10
                      bg-gradient-to-r from-background via-background/95 to-transparent pointer-events-none">
        <Bell size={11} className={cn(
          'flex-shrink-0 animate-pulse',
          hasOverdue ? 'text-red-500' : hasUrgent ? 'text-orange-500' : 'text-primary'
        )} />
        <span className={cn(
          'text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap',
          hasOverdue ? 'text-red-500' : hasUrgent ? 'text-orange-500' : 'text-primary'
        )}>
          Live Alerts
        </span>
      </div>

      <div className="absolute right-0 top-0 bottom-0 z-20 w-10
                      bg-gradient-to-l from-background/90 to-transparent pointer-events-none" />

      <div
        className="global-alert-ticker flex items-center h-full whitespace-nowrap"
        style={{ paddingLeft: '110px' }}
      >
        {tripled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mr-10">
            <span className={cn(
              'text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wide flex-shrink-0',
              urgencyStyle[item.urgency]
            )}>
              {urgencyLabel[item.urgency]}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {item.icon} {item.label}
            </span>
            <span className={cn(
              'text-[10px] font-medium',
              item.urgency === 'overdue' ? 'text-red-500 font-bold'
              : item.urgency === 'urgent' ? 'text-orange-500 font-semibold'
              : 'text-muted-foreground'
            )}>
              {item.dateLabel}
            </span>
            <span className="text-muted-foreground/25 text-xs mx-0.5">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes global-alert-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .global-alert-ticker {
          animation: global-alert-scroll ${duration}s linear infinite;
          display: flex;
          width: max-content;
        }
        .global-alert-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

// --- Main Dashboard ---

export default function Dashboard() {
  const { data } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Revenue stats
  const totalRevenue = useMemo(() =>
    data.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount || 0), 0),
  [data.payments]);

  const pendingRevenue = useMemo(() =>
    data.payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (p.amount || 0), 0),
  [data.payments]);

  // Build alert items
  const alertItems = useMemo((): AlertItem[] => {
    if (!mounted) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items: AlertItem[] = [];

    data.reminders.forEach(r => {
      let d = 999;
      try { d = differenceInCalendarDays(parseISO(r.date), today); } catch {}
      if (d > 30) return;
      const urgency: Urgency = d < 0 ? 'overdue' : d === 0 ? 'urgent' : d <= 7 ? 'urgent' : 'soon';
      const icon = r.type === 'Domain' ? '🌐' : r.type === 'Hosting' ? '🖥️' : r.type === 'Payment' ? '💳' : '⚙️';
      const dateLabel =
        d < 0   ? `${Math.abs(d)}d OVERDUE (due ${r.date})` :
        d === 0 ? `DUE TODAY · ${r.date}` :
        d <= 7  ? `${d}d left · ${r.date}` :
                  `${d}d away · ${r.date}`;
      items.push({ label: r.title, dateLabel, urgency, icon });
    });

    data.websites.forEach(w => {
      if (!w.expiryDate) return;
      let d = 999;
      try { d = differenceInCalendarDays(parseISO(w.expiryDate), today); } catch {}
      if (d > 30) return;
      const urgency: Urgency = d < 0 ? 'overdue' : d === 0 ? 'urgent' : d <= 7 ? 'urgent' : 'soon';
      const client = data.clients.find(c => c.id === w.clientId);
      const label  = `${w.domainName}${client ? ` · ${client.businessName}` : ''}`;
      const dateLabel =
        d < 0   ? `${Math.abs(d)}d OVERDUE (expired ${w.expiryDate})` :
        d === 0 ? `EXPIRES TODAY · ${w.expiryDate}` :
        d <= 7  ? `Expires in ${d}d · ${w.expiryDate}` :
                  `Expires in ${d}d · ${w.expiryDate}`;
      items.push({ label, dateLabel, urgency, icon: '🌐' });
    });

    data.tasks.filter(t => t.status !== 'Completed' && t.dueDate).forEach(t => {
      let d = 999;
      try { d = differenceInCalendarDays(parseISO(t.dueDate!), today); } catch {}
      if (d >= 0) return;
      const client = data.clients.find(c => c.id === t.clientId);
      const label  = `${t.description.slice(0, 32)}${t.description.length > 32 ? '…' : ''}${client ? ` · ${client.businessName}` : ''}`;
      items.push({ label, dateLabel: `${Math.abs(d)}d OVERDUE`, urgency: 'overdue', icon: '✅' });
    });

    data.payments.filter(p => p.status === 'PENDING').forEach(p => {
      let d = 999;
      try { d = differenceInCalendarDays(today, parseISO(p.paymentDate)); } catch {}
      if (d < 7) return;
      const client = data.clients.find(c => c.id === p.clientId);
      items.push({
        label:     `Invoice ${p.invoiceNumber}${client ? ` · ${client.businessName}` : ''}`,
        dateLabel: `Pending ${d}d · GHS ${p.amount.toLocaleString()}`,
        urgency:   d > 30 ? 'overdue' : 'urgent',
        icon:      '💳',
      });
    });

    const order: Record<Urgency, number> = { overdue: 0, urgent: 1, soon: 2, ok: 3 };
    return items.sort((a, b) => order[a.urgency] - order[b.urgency]);
  }, [data, mounted]);

  // Stats cards
  const stats = [
    { label: 'Total Clients',   value: data.clients.length,                                     icon: Users,       trend: '+2 this month',                                         color: 'text-primary' },
    { label: 'Active Websites', value: data.websites.length,                                     icon: Globe,       trend: 'All systems live',                                      color: 'text-emerald-500' },
    { label: 'Completed Tasks', value: data.tasks.filter(t => t.status === 'Completed').length,  icon: CheckSquare, trend: `${data.tasks.filter(t => t.status !== 'Completed').length} pending`, color: 'text-violet-500' },
    { label: 'Total Revenue',   value: `GHS ${totalRevenue.toLocaleString()}`,                   icon: CreditCard,  trend: `+GHS ${pendingRevenue.toLocaleString()} pending`,        color: 'text-amber-500' },
  ];

  // Chart data
  const chartData = useMemo(() => {
    const monthTotals: Record<string, number> = {};
    data.payments.filter(p => p.status === 'PAID').forEach(p => {
      const d = new Date(p.paymentDate);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString('default', { month: 'short' });
      monthTotals[key] = (monthTotals[key] || 0) + p.amount;
    });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const entries = Object.entries(monthTotals);
    if (entries.length === 0) return months.slice(0, 5).map(name => ({ name, revenue: 0 }));
    return entries
      .sort((a, b) => months.indexOf(a[0]) - months.indexOf(b[0]))
      .map(([name, revenue]) => ({ name, revenue }));
  }, [data.payments]);

  // Upcoming renewals — ALL sites with expiry, sorted nearest first, with urgency + client info
  const upcomingRenewals = useMemo(() => {
    if (!mounted) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.websites
      .filter(w => w.expiryDate && w.expiryDate.length > 0)
      .map(w => {
        let daysLeft = 9999;
        try { daysLeft = differenceInCalendarDays(parseISO(w.expiryDate!), today); } catch {}
        const urgency: Urgency =
          daysLeft < 0   ? 'overdue' :
          daysLeft === 0 ? 'urgent'  :
          daysLeft <= 7  ? 'urgent'  :
          daysLeft <= 30 ? 'soon'    : 'ok';
        const client = data.clients.find(c => c.id === w.clientId);
        return { ...w, daysLeft, urgency, client };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.websites, data.clients, mounted]);

  // AI insight
  const aiInsight = useMemo(() => {
    if (data.clients.length === 0)
      return "Welcome to TGNE CORE. Start by adding your first client to generate insights.";
    const overduePayments = data.payments.filter(p => p.status === 'PENDING').length;
    const soonExpiring    = data.websites.filter(w => {
      if (!w.expiryDate) return false;
      const diff = new Date(w.expiryDate).getTime() - new Date().getTime();
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
    }).length;
    if (overduePayments > 0)
      return `Attention: You have ${overduePayments} pending invoice${overduePayments > 1 ? 's' : ''}. Send follow-up emails to maintain healthy cash flow.`;
    if (soonExpiring > 0)
      return `All invoices are paid. However, ${soonExpiring} domain${soonExpiring > 1 ? 's' : ''} expire within 30 days — start the renewal process now.`;
    return `Revenue is steady at GHS ${totalRevenue.toLocaleString()}. You're doing great! Consider growing your client base by 10%.`;
  }, [data, totalRevenue]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return [
      ...data.clients.map(c  => ({ label: `New Client: ${c.businessName}`,                           time: c.createdAt })),
      ...data.payments.map(p => ({ label: `Invoice ${p.status === 'PAID' ? 'Paid' : 'Pending'}: GHS ${p.amount}`, time: p.createdAt })),
      ...data.tasks.filter(t => t.status === 'Completed').map(t => ({ label: `Task Done: ${t.description}`, time: t.dueDate || '' })),
    ]
    .filter(i => i.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              Project Pulse <Zap className="text-primary animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Central command for your digital agency operations.
            </p>
          </div>
          <Badge variant="outline"
            className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 font-bold shadow-sm self-start md:self-auto">
            Live Sync Active
          </Badge>
        </div>

        {/* Global Alert Ticker */}
        {mounted && <GlobalAlertTicker items={alertItems} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="premium-card bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {stat.label}
                      </p>
                      <h3 className="text-3xl font-bold mt-2 text-foreground">{stat.value}</h3>
                      <p className={cn('text-xs mt-2 flex items-center gap-1 font-semibold', stat.color)}>
                        <TrendingUp size={12} /> {stat.trend}
                      </p>
                    </div>
                    <div className={cn('p-4 rounded-2xl bg-muted/50 border', stat.color)}>
                      <Icon size={22} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Chart + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 premium-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Financial Growth</CardTitle>
              <Badge variant="secondary" className="bg-muted px-3 py-1 font-bold">FY 2024</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))', borderRadius: '12px',
                        border: '1px solid hsl(var(--border))', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity size={18} className="text-primary" /> Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((item, idx) => (
                  <div key={idx}
                    className="flex items-start gap-3 border-b border-muted pb-3 last:border-0 last:pb-0">
                    <div className="p-1.5 bg-muted rounded-full flex-shrink-0">
                      <History size={12} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(item.time).toLocaleDateString()} · Verified
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic text-center py-6">
                    No activity yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Renewals + AI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Upcoming Renewals — full list, sorted, urgency-coded, clickable */}
          <Card className="premium-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Upcoming Renewals</CardTitle>
              {upcomingRenewals.length > 0 && (
                <Link href="/clients"
                  className="text-[10px] font-bold text-primary/70 hover:text-primary uppercase tracking-wider flex items-center gap-1 transition-colors">
                  View all &rarr;
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {upcomingRenewals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                  <Calendar size={32} className="opacity-20" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">No renewals scheduled</p>
                    <p className="text-xs mt-1">Add an expiry date to a website to start tracking renewals.</p>
                  </div>
                  <Link href="/clients"
                    className="mt-1 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                    Manage Websites
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {upcomingRenewals.map((renewal) => {
                    const urgencyBadge: Record<Urgency, string> = {
                      overdue: 'bg-red-500/15 text-red-600 border-red-400/30',
                      urgent:  'bg-orange-500/15 text-orange-600 border-orange-400/30',
                      soon:    'bg-amber-500/10 text-amber-600 border-amber-400/20',
                      ok:      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    };
                    const urgencyLabel: Record<Urgency, string> = {
                      overdue: `${Math.abs(renewal.daysLeft)}d OVERDUE`,
                      urgent:  renewal.daysLeft === 0 ? 'TODAY' : `${renewal.daysLeft}d left`,
                      soon:    `${renewal.daysLeft}d left`,
                      ok:      `${renewal.daysLeft}d left`,
                    };
                    const rowBorder: Record<Urgency, string> = {
                      overdue: 'border-red-400/25 bg-red-500/5',
                      urgent:  'border-orange-400/25 bg-orange-500/5',
                      soon:    'border-amber-400/20 bg-amber-500/5',
                      ok:      'border-transparent',
                    };
                    const formattedDate = (() => {
                      try { return format(parseISO(renewal.expiryDate!), 'dd MMM yyyy'); }
                      catch { return renewal.expiryDate ?? ''; }
                    })();
                    return (
                      <Link
                        key={renewal.id}
                        href="/clients"
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/60 hover:border-border transition-all group',
                          rowBorder[renewal.urgency]
                        )}>
                        <div className={cn(
                          'p-2.5 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform',
                          renewal.urgency === 'overdue' ? 'bg-red-500/15 text-red-500' :
                          renewal.urgency === 'urgent'  ? 'bg-orange-500/15 text-orange-500' :
                          renewal.urgency === 'soon'    ? 'bg-amber-500/10 text-amber-600' :
                                                          'bg-primary/10 text-primary'
                        )}>
                          <Calendar size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-foreground">{renewal.domainName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {renewal.client?.businessName ? `${renewal.client.businessName} · ` : ''}
                            Expires {formattedDate}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-[9px] font-black flex-shrink-0 px-2', urgencyBadge[renewal.urgency])}>
                          {urgencyLabel[renewal.urgency]}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Strategy */}
          <Card className="premium-card bg-primary/5 border-primary/20 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl
                            group-hover:bg-primary/20 transition-all duration-700" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-primary animate-pulse" /> AI Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-sm text-foreground/90 leading-relaxed font-medium italic">
                &ldquo;{aiInsight}&rdquo;
              </p>
              <Button
                className="mt-5 w-full premium-button bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl shadow-lg shadow-primary/20"
                asChild
              >
                <Link href="/tasks">View Action Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
