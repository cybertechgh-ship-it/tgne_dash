"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import {
  Bell, Globe, CreditCard, Settings, CalendarDays,
  ShieldCheck, Server, Plus, Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgency = 'overdue' | 'urgent' | 'soon' | 'ok';

interface TickerItem {
  label:     string;
  dateLabel: string;
  urgency:   Urgency;
  typeIcon:  string;
}

// ─── Announcement Bar ─────────────────────────────────────────────────────────

function AnnouncementBar({ items }: { items: TickerItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/30 border border-border h-11 flex items-center justify-center">
        <span className="text-xs text-muted-foreground italic flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          All clear — no upcoming alerts scheduled.
        </span>
      </div>
    );
  }

  const tripled = [...items, ...items, ...items];
  // Adjust speed based on number of items so each item is readable
  const duration = Math.max(25, Math.min(90, items.length * 14));

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
    ok:      '✓ ACTIVE',
  };

  // Use a red tint bar for any overdue items
  const hasOverdue = items.some(i => i.urgency === 'overdue');

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl h-12 border",
      hasOverdue
        ? "bg-gradient-to-r from-red-500/10 via-accent/20 to-red-500/10 border-red-400/25"
        : "bg-gradient-to-r from-primary/8 via-accent/40 to-primary/8 border-primary/15"
    )}>
      {/* Left pinned label + fade */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2.5 pl-4 pr-8 bg-gradient-to-r from-background via-background/95 to-transparent pointer-events-none">
        <span className={cn("w-2 h-2 rounded-full animate-pulse flex-shrink-0",
          hasOverdue ? "bg-red-500" : "bg-primary")} />
        <span className={cn("text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap",
          hasOverdue ? "text-red-500" : "text-primary")}>
          🔔 Alerts
        </span>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-background/90 to-transparent pointer-events-none" />

      {/* Scrolling track */}
      <div className="reminders-ticker flex items-center h-full whitespace-nowrap" style={{ paddingLeft: '130px' }}>
        {tripled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 mr-12">
            <span className={cn('text-[9px] font-black px-2.5 py-0.5 rounded-full border tracking-wide', urgencyStyle[item.urgency])}>
              {urgencyLabel[item.urgency]}
            </span>
            <span className="text-xs font-bold text-foreground">{item.typeIcon} {item.label}</span>
            <span className={cn("text-[10px] font-semibold",
              item.urgency === 'overdue' ? "text-red-500" :
              item.urgency === 'urgent'  ? "text-orange-500" : "text-muted-foreground")}>
              {item.dateLabel}
            </span>
            <span className="text-muted-foreground/30 font-bold text-sm mx-1">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes reminders-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .reminders-ticker {
          animation: reminders-scroll ${duration}s linear infinite;
          display: flex;
          width: max-content;
        }
        .reminders-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { data, addReminder, deleteReminder } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState({
    type:    'Web Management' as 'Web Management' | 'Domain' | 'Hosting' | 'Payment',
    title:   '',
    date:    new Date().toISOString().split('T')[0],
    details: '',
  });

  useEffect(() => { setMounted(true); }, []);

  const allReminders = useMemo(() =>
    [...data.reminders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data.reminders]
  );

  // Build ticker items — overdue items first, then urgent, soon, ok
  const tickerItems = useMemo((): TickerItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allReminders
      .map(r => {
        let daysLeft = 999;
        try { daysLeft = differenceInCalendarDays(parseISO(r.date), today); } catch {}

        const urgency: Urgency =
          daysLeft < 0   ? 'overdue' :
          daysLeft === 0 ? 'urgent'  :
          daysLeft <= 7  ? 'urgent'  :
          daysLeft <= 30 ? 'soon'    : 'ok';

        const typeIcon = r.type === 'Domain' ? '🌐' : r.type === 'Hosting' ? '🖥️' : r.type === 'Payment' ? '💳' : '⚙️';

        const dateLabel =
          daysLeft < 0   ? `${Math.abs(daysLeft)}d OVERDUE (due ${r.date})` :
          daysLeft === 0 ? `DUE TODAY · ${r.date}` :
          daysLeft <= 7  ? `${daysLeft}d left · ${r.date}` :
                           `${daysLeft}d away · ${r.date}`;

        return { label: r.title, dateLabel, urgency, typeIcon };
      })
      .sort((a, b) => {
        const order: Record<Urgency, number> = { overdue: 0, urgent: 1, soon: 2, ok: 3 };
        return order[a.urgency] - order[b.urgency];
      });
  }, [allReminders]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Domain':         return <Globe     size={18} />;
      case 'Hosting':        return <Server    size={18} />;
      case 'Web Management': return <Settings  size={18} />;
      case 'Payment':        return <CreditCard size={18} />;
      default:               return <Bell      size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Domain':         return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Hosting':        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Web Management': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Payment':        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:               return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const generateGoogleCalendarUrl = (reminder: typeof allReminders[0]) => {
    const title   = encodeURIComponent(`[TGNE] ${reminder.title}`);
    const dateStr = reminder.date.replace(/-/g, '');
    const details = encodeURIComponent(reminder.details || 'Automated reminder via TGNE dashboard.');
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&sf=true&output=xml`;
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    addReminder(newReminder);
    setIsAddOpen(false);
    setNewReminder({ type: 'Web Management', title: '', date: new Date().toISOString().split('T')[0], details: '' });
  };

  const groups = {
    all:     allReminders,
    web:     allReminders.filter(r => r.type === 'Web Management'),
    domain:  allReminders.filter(r => r.type === 'Domain'),
    hosting: allReminders.filter(r => r.type === 'Hosting'),
  };

  const ReminderList = ({ reminders }: { reminders: typeof allReminders }) => (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let daysLeft = 999;
        try { daysLeft = differenceInCalendarDays(parseISO(reminder.date), today); } catch {}
        const isOverdue   = daysLeft < 0;
        const isDueToday  = daysLeft === 0;
        const isUrgent    = daysLeft >= 0 && daysLeft <= 7;

        const dueBadgeText = isOverdue   ? `${Math.abs(daysLeft)}d OVERDUE`
                           : isDueToday  ? 'DUE TODAY'
                           : isUrgent    ? `${daysLeft}d left`
                           : null;

        return (
          <Card key={reminder.id} className={cn(
            'group overflow-hidden premium-card border-l-4 transition-all',
            isOverdue  ? 'border-l-destructive bg-destructive/5 hover:bg-destructive/8' :
            isDueToday ? 'border-l-orange-500 bg-orange-500/5' :
            isUrgent   ? 'border-l-amber-500' :
                         'border-l-primary'
          )}>
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-2xl border', getTypeColor(reminder.type))}>
                  {getTypeIcon(reminder.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-base">{reminder.title}</h4>
                    {dueBadgeText && (
                      <Badge
                        variant={isOverdue ? 'destructive' : 'outline'}
                        className={cn(
                          'text-[10px] h-5 font-black uppercase tracking-wider',
                          !isOverdue && isDueToday && 'border-orange-500 text-orange-600 bg-orange-500/10',
                          !isOverdue && isUrgent && !isDueToday && 'border-amber-500 text-amber-600 bg-amber-500/10'
                        )}>
                        {dueBadgeText}
                      </Badge>
                    )}
                  </div>
                  {reminder.details && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{reminder.details}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={cn(
                      'text-xs font-semibold flex items-center gap-1',
                      isOverdue ? 'text-destructive' : isDueToday ? 'text-orange-600' : 'text-muted-foreground'
                    )}>
                      <CalendarDays size={13} className={isOverdue ? 'text-destructive' : isDueToday ? 'text-orange-500' : 'text-primary'} />
                      {isOverdue   ? `Was due: ${reminder.date} (${Math.abs(daysLeft)}d ago)` :
                       isDueToday  ? `Due today: ${reminder.date}` :
                                     `Scheduled: ${reminder.date}${isUrgent ? ` · ${daysLeft}d away` : ''}`}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-2">{reminder.type}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button className="flex-1 sm:flex-none gap-2 premium-button" size="sm" asChild>
                  <a href={generateGoogleCalendarUrl(reminder)} target="_blank" rel="noopener noreferrer">
                    <CalendarDays size={14} /> Export
                  </a>
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(reminder.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {reminders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl text-muted-foreground gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bell size={28} className="text-primary/40" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">No alerts in this category</p>
            <p className="text-sm mt-1">Add a reminder to start tracking upcoming renewals and follow-ups.</p>
          </div>
          <Button variant="outline" className="gap-2 mt-1" onClick={() => setIsAddOpen(true)}>
            <Plus size={14} /> Schedule a Reminder
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">TGNE Alert Center</h1>
            <p className="text-muted-foreground mt-2 text-lg">Centralized tracking for renewals and digital management.</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg premium-button bg-primary text-primary-foreground">
                  <Plus size={18} /> New Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Schedule Alert</DialogTitle></DialogHeader>
                <form onSubmit={handleAddReminder} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={v => setNewReminder({...newReminder, type: v as typeof newReminder.type})} defaultValue="Web Management">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web Management">Web Management</SelectItem>
                        <SelectItem value="Domain">Domain Renewal</SelectItem>
                        <SelectItem value="Hosting">Hosting Renewal</SelectItem>
                        <SelectItem value="Payment">Payment Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Alert Title</Label>
                    <Input id="title" required placeholder="e.g. Domain Renewal: client.com" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Scheduled Date</Label>
                    <Input id="date" type="date" required value={newReminder.date} onChange={e => setNewReminder({...newReminder, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">Description / Notes</Label>
                    <Textarea id="details" placeholder="Additional context for the reminder..." value={newReminder.details} onChange={e => setNewReminder({...newReminder, details: e.target.value})} />
                  </div>
                  <div className="pt-2 border-t mt-4">
                    <Button type="submit" className="w-full">Create Local Alert</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Announcement Ticker ──────────────────────────────────────── */}
        {mounted && <AnnouncementBar items={tickerItems} />}

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-8 h-12 gap-1 rounded-2xl border">
            <TabsTrigger value="all"     className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Alerts</TabsTrigger>
            <TabsTrigger value="web"     className="rounded-xl px-6 data-[state=active]:bg-amber-500 data-[state=active]:text-white">Web Management</TabsTrigger>
            <TabsTrigger value="domain"  className="rounded-xl px-6 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Domain Renewals</TabsTrigger>
            <TabsTrigger value="hosting" className="rounded-xl px-6 data-[state=active]:bg-purple-500 data-[state=active]:text-white">Hosting Renewals</TabsTrigger>
          </TabsList>

          <TabsContent value="all">     {mounted && <ReminderList reminders={groups.all} />}</TabsContent>
          <TabsContent value="web">     {mounted && <ReminderList reminders={groups.web} />}</TabsContent>
          <TabsContent value="domain">  {mounted && <ReminderList reminders={groups.domain} />}</TabsContent>
          <TabsContent value="hosting"> {mounted && <ReminderList reminders={groups.hosting} />}</TabsContent>
        </Tabs>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await deleteReminder(deleteTarget); setDeleteTarget(null); } }}
        title="Delete this reminder?"
        description="This alert will be permanently removed."
        confirmLabel="Delete Reminder"
        variant="danger"
      />
    </DashboardLayout>
  );
}