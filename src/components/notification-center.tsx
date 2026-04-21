/**
 * src/components/notification-center.tsx
 * Bell dropdown notification center — shows overdue payments, expiring domains,
 * overdue tasks, and unread reminders. Mark-as-read, badge count, grouped view.
 */

"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, AlertCircle, Clock, Globe, CreditCard, CheckSquare } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NotifSeverity = 'critical' | 'warning' | 'info';

interface Notif {
  id:       string;
  icon:     React.ElementType;
  label:    string;
  sub:      string;
  severity: NotifSeverity;
  action?:  () => void;
}

export function NotificationCenter() {
  const { data, markReminderRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifs = useMemo((): Notif[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items: Notif[] = [];

    // 1. Unread reminders
    data.reminders.filter(r => !r.isRead).forEach(r => {
      let d = 0;
      try { d = differenceInCalendarDays(parseISO(r.date), today); } catch {}
      items.push({
        id:       `rem-${r.id}`,
        icon:     Clock,
        label:    r.title,
        sub:      d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `Due in ${d}d`,
        severity: d <= 0 ? 'critical' : d <= 7 ? 'warning' : 'info',
        action:   () => markReminderRead(r.id),
      });
    });

    // 2. Expiring websites (within 30 days)
    data.websites.forEach(w => {
      if (!w.expiryDate) return;
      let d = 999;
      try { d = differenceInCalendarDays(parseISO(w.expiryDate), today); } catch {}
      if (d > 30) return;
      const client = data.clients.find(c => c.id === w.clientId);
      items.push({
        id:       `web-${w.id}`,
        icon:     Globe,
        label:    `${w.domainName} expiring`,
        sub:      d < 0 ? `${Math.abs(d)}d OVERDUE` : d === 0 ? 'Expires TODAY' : `Expires in ${d}d`,
        severity: d <= 0 ? 'critical' : d <= 7 ? 'warning' : 'info',
      });
      void client;
    });

    // 3. Pending invoices > 7 days old
    data.payments.filter(p => p.status === 'PENDING').forEach(p => {
      let age = 0;
      try { age = differenceInCalendarDays(today, parseISO(p.paymentDate)); } catch {}
      if (age < 7) return;
      const client = data.clients.find(c => c.id === p.clientId);
      items.push({
        id:       `pay-${p.id}`,
        icon:     CreditCard,
        label:    `${p.invoiceNumber} unpaid`,
        sub:      `${client?.businessName ?? 'Client'} · ${age}d pending · GHS ${p.amount.toLocaleString()}`,
        severity: age > 30 ? 'critical' : 'warning',
      });
    });

    // 4. Overdue tasks
    data.tasks.filter(t => t.status !== 'Completed' && t.dueDate).forEach(t => {
      let d = 0;
      try { d = differenceInCalendarDays(parseISO(t.dueDate!), today); } catch {}
      if (d >= 0) return;
      const client = data.clients.find(c => c.id === t.clientId);
      items.push({
        id:       `task-${t.id}`,
        icon:     CheckSquare,
        label:    t.description.slice(0, 40),
        sub:      `${client?.businessName ?? ''} · ${Math.abs(d)}d overdue`,
        severity: 'critical',
      });
    });

    const order: Record<NotifSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return items.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [data, markReminderRead]);

  const criticalCount = notifs.filter(n => n.severity === 'critical').length;
  const badgeCount    = notifs.length;

  const severityStyle: Record<NotifSeverity, string> = {
    critical: 'text-red-500 bg-red-500/10 border-red-500/20',
    warning:  'text-amber-500 bg-amber-500/10 border-amber-500/20',
    info:     'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative p-2 rounded-xl transition-all',
          open ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted'
        )}
        aria-label="Notifications"
      >
        <Bell size={20} className={criticalCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''} />
        {badgeCount > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-black text-white',
            criticalCount > 0 ? 'bg-red-500' : 'bg-amber-500'
          )}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className={criticalCount > 0 ? 'text-red-500' : 'text-primary'} />
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {badgeCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{badgeCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {data.reminders.some(r => !r.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => data.reminders.filter(r => !r.isRead).forEach(r => markReminderRead(r.id))}
                >
                  <CheckCheck size={12} /> Mark all read
                </Button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Bell size={30} className="opacity-20" />
                <p className="text-sm font-medium">All clear — no alerts</p>
                <p className="text-xs">You're on top of everything.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifs.map(n => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                    >
                      <div className={cn('p-2 rounded-xl border flex-shrink-0 mt-0.5', severityStyle[n.severity])}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{n.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{n.sub}</p>
                      </div>
                      {n.action && (
                        <button
                          onClick={n.action}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-500"
                          title="Mark read"
                        >
                          <CheckCheck size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t px-4 py-2.5 bg-muted/20">
              <p className="text-[10px] text-muted-foreground text-center">
                {criticalCount > 0 && <span className="text-red-500 font-bold">{criticalCount} critical · </span>}
                Showing items within 30 days or overdue
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
