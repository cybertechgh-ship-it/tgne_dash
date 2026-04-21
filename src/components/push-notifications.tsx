/**
 * src/components/push-notifications.tsx
 * Browser push notification manager — request permission, send push
 * for critical alerts (overdue items). Works via service worker.
 */

"use client";

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported,  setSupported]  = useState(false);

  useEffect(() => {
    const ok = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const request = async (): Promise<boolean> => {
    if (!supported) return false;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === 'granted';
  };

  const send = (title: string, body: string, icon?: string) => {
    if (permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: icon ?? 'https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png',
      badge: 'https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png',
      tag:   'tgne-alert',
    });
  };

  return { permission, supported, request, send };
}

interface Props {
  criticalCount: number;
  criticalItems: { label: string; sub: string }[];
}

export function PushNotificationToggle({ criticalCount, criticalItems }: Props) {
  const { permission, supported, request, send } = usePushNotifications();
  const [sent, setSent] = useState(false);

  if (!supported) return null;

  const handleEnable = async () => {
    const ok = await request();
    if (ok && criticalCount > 0 && !sent) {
      send(
        `⚡ ${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''} — TGNE`,
        criticalItems.slice(0, 3).map(i => i.label).join(' · ')
      );
      setSent(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleEnable}
      className={cn(
        'h-8 gap-1.5 text-xs font-medium',
        permission === 'granted'
          ? 'text-emerald-600 hover:text-emerald-700'
          : permission === 'denied'
            ? 'text-muted-foreground cursor-not-allowed'
            : 'text-muted-foreground hover:text-primary'
      )}
      disabled={permission === 'denied'}
      title={
        permission === 'granted' ? 'Push notifications enabled'
        : permission === 'denied' ? 'Blocked — reset in browser settings'
        : 'Enable push notifications'
      }
    >
      {permission === 'granted'
        ? <><BellRing size={14} className="text-emerald-500" /> Alerts On</>
        : permission === 'denied'
          ? <><BellOff size={14} /> Blocked</>
          : <><Bell size={14} /> Enable Alerts</>
      }
    </Button>
  );
}
