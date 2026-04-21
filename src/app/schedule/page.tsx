"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { getCalApi } from "@calcom/embed-react";
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Sparkles, Globe, CheckSquare, ShieldCheck } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgency = 'overdue' | 'urgent' | 'soon' | 'ok';

interface TickerItem {
  label:     string;
  dateLabel: string;
  urgency:   Urgency;
  icon:      string;
}

// ─── Schedule Ticker ──────────────────────────────────────────────────────────

function ScheduleTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/30 border border-border h-11 flex items-center justify-center">
        <span className="text-xs text-muted-foreground italic flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          No upcoming deadlines or expirations found.
        </span>
      </div>
    );
  }

  const trippled = [...items, ...items, ...items];

  const urgencyStyle: Record<Urgency, string> = {
    overdue: 'bg-red-500/15 text-red-500 border-red-400/30',
    urgent:  'bg-orange-500/15 text-orange-500 border-orange-400/30',
    soon:    'bg-amber-500/15 text-amber-600 border-amber-400/30',
    ok:      'bg-emerald-500/15 text-emerald-600 border-emerald-400/30',
  };
  const urgencyLabel: Record<Urgency, string> = {
    overdue: '⚡ EXPIRED',
    urgent:  '🔥 URGENT',
    soon:    '📅 SOON',
    ok:      '✓ UPCOMING',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/8 via-accent/40 to-violet-500/8 border border-violet-400/15 h-12">
      {/* Left pinned label */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2.5 pl-4 pr-8 bg-gradient-to-r from-background via-background/95 to-transparent pointer-events-none">
        <CalendarDays size={12} className="text-violet-500 flex-shrink-0" />
        <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.18em] whitespace-nowrap">
          Schedule
        </span>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-background/90 to-transparent pointer-events-none" />

      {/* Scrolling track */}
      <div className="schedule-ticker flex items-center h-full whitespace-nowrap" style={{ paddingLeft: '120px' }}>
        {trippled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 mr-10">
            <span className={cn('text-[9px] font-black px-2.5 py-0.5 rounded-full border tracking-wide', urgencyStyle[item.urgency])}>
              {urgencyLabel[item.urgency]}
            </span>
            <span className="text-xs font-semibold text-foreground">{item.icon} {item.label}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{item.dateLabel}</span>
            <span className="text-violet-400/30 font-bold text-sm mx-1">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes schedule-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .schedule-ticker {
          animation: schedule-scroll 60s linear infinite;
          display: flex;
          width: max-content;
        }
        .schedule-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { data } = useApp();
  const [mounted, setMounted] = useState(false);
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK || 'augustine-nyaaba-mrol6e';

  useEffect(() => {
    setMounted(true);
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        theme: "auto",
        styles: { branding: { brandColor: "#8b5cf6" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  // Build ticker items from websites (expiry) + tasks (due dates) + reminders
  const tickerItems = useMemo((): TickerItem[] => {
    const items: TickerItem[] = [];
    const today = new Date();

    // Websites with expiry
    data.websites.forEach(w => {
      if (!w.expiryDate) return;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(parseISO(w.expiryDate), today); } catch {}
      const urgency: Urgency = daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : 'ok';
      const client = data.clients.find(c => c.id === w.clientId);
      const label  = `${w.domainName}${client ? ` · ${client.businessName}` : ''}`;
      const dateLabel = daysLeft < 0
        ? `Expired ${Math.abs(daysLeft)}d ago`
        : daysLeft === 0 ? 'Expires today!'
        : `Expires in ${daysLeft}d`;
      items.push({ label, dateLabel, urgency, icon: '🌐' });
    });

    // Tasks with due dates (non-completed)
    data.tasks.filter(t => t.status !== 'Completed' && t.dueDate).forEach(t => {
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(parseISO(t.dueDate!), today); } catch {}
      const urgency: Urgency = daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'urgent' : daysLeft <= 14 ? 'soon' : 'ok';
      const client = data.clients.find(c => c.id === t.clientId);
      const label  = `${t.description.slice(0, 35)}${t.description.length > 35 ? '…' : ''}${client ? ` · ${client.businessName}` : ''}`;
      const dateLabel = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`;
      items.push({ label, dateLabel, urgency, icon: '✅' });
    });

    // Reminders
    data.reminders.forEach(r => {
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(parseISO(r.date), today); } catch {}
      const urgency: Urgency = daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : 'ok';
      const dateLabel = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `In ${daysLeft}d · ${r.date}`;
      const icon = r.type === 'Domain' ? '🌐' : r.type === 'Hosting' ? '🖥️' : r.type === 'Payment' ? '💳' : '⚙️';
      items.push({ label: r.title, dateLabel, urgency, icon });
    });

    // Sort by urgency then days
    const urgencyOrder: Record<Urgency, number> = { overdue: 0, urgent: 1, soon: 2, ok: 3 };
    return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              Scheduler <CalendarDays className="text-primary" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Book strategy sessions and project updates with ease.</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3">
            <Sparkles className="text-primary animate-pulse" size={24} />
            <span className="text-sm font-bold text-primary">Synced with Cal.com</span>
          </div>
        </div>

        {/* ── Announcement Ticker ──────────────────────────────────────── */}
        {mounted && <ScheduleTicker items={tickerItems} />}

        {/* Cal.com Embed */}
        <Card className="premium-card overflow-hidden h-[700px]">
          <CardContent className="p-0 h-full">
            <iframe
              src={`https://cal.com/${calLink}`}
              title="Cal.com Scheduler"
              className="w-full h-full border-none"
              allow="geolocation; microphone; camera; payment"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-accent/30 border border-white/5">
            <h3 className="font-bold text-lg mb-2">Automated Invites</h3>
            <p className="text-sm text-muted-foreground">Meeting invites are automatically sent to both you and your client upon booking.</p>
          </div>
          <div className="p-6 rounded-3xl bg-accent/30 border border-white/5">
            <h3 className="font-bold text-lg mb-2">Buffer Times</h3>
            <p className="text-sm text-muted-foreground">Pre-configured 15-minute buffers ensure you have time to prep between clients.</p>
          </div>
          <div className="p-6 rounded-3xl bg-accent/30 border border-white/5">
            <h3 className="font-bold text-lg mb-2">G-Calendar Sync</h3>
            <p className="text-sm text-muted-foreground">All appointments are mirrored to your primary agency calendar instantly.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
