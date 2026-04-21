"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  CheckSquare,
  Bell,
  Bot,
  RotateCcw,
  Menu,
  Sun,
  Moon,
  LogOut,
  CalendarDays,
  CreditCard,
  FileText,
  Download,
  Shield,
  Mail,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import { AIChat } from '@/components/ai/ai-chat';
import { NotificationCenter } from '@/components/notification-center';
import { exportFullReportPdf, exportClientsCsv, exportPaymentsCsv } from '@/lib/export-utils';

const navItems = [
  { name: 'Dashboard',   href: '/',            icon: LayoutDashboard },
  { name: 'Clients',     href: '/clients',     icon: Users },
  { name: 'Invoices',    href: '/invoices',    icon: CreditCard },
  { name: 'Credentials', href: '/credentials', icon: KeyRound },
  { name: 'Tasks',       href: '/tasks',       icon: CheckSquare },
  { name: 'Reminders',   href: '/reminders',   icon: Bell },
  { name: 'Schedule',    href: '/schedule',    icon: CalendarDays },
  { name: 'Audit Log',   href: '/audit',       icon: Shield },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [aiOpen,        setAiOpen]        = useState(false);
  const [isDark,        setIsDark]        = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const [digestSending, setDigestSending] = useState(false);
  const { data, isAuthorized, logout } = useApp();

  const handleSendDigest = async () => {
    setDigestSending(true);
    try {
      const res = await fetch('/api/email-digest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const json = await res.json();
      if (res.ok) {
        alert(`Digest sent to ${json.to}`);
      } else {
        alert(`Failed: ${json.error}\n${json.details ?? ''}`);
      }
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setDigestSending(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthorized && pathname !== '/tgnes') {
      router.push('/tgnes');
    }
  }, [isAuthorized, pathname, router]);

  // ── Dark mode flash fix: read preference BEFORE paint ─────────────────────
  useEffect(() => {
    const saved   = localStorage.getItem('theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark    = saved === 'dark' || (!saved && sysDark);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else      document.documentElement.classList.remove('dark');
  }, []);

  // Sync with OS preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  const handleBackup = () => {
    window.open('/api/backup', '_blank');
  };

  const logoUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png";

  if (!mounted || (!isAuthorized && pathname !== '/tgnes')) {
    return (
      <div className="h-screen w-full bg-[#02040a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r transition-transform lg:translate-x-0 lg:static",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl border-2 border-primary/20 bg-white flex items-center justify-center group-hover:border-primary transition-colors">
              <Image src={logoUrl} alt="TGNE Logo" fill className="object-contain p-1.5" priority />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-primary">TGNE</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-bold"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t space-y-3">
            {/* AI Assistant */}
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-3 rounded-xl border-primary/10 hover:border-primary/40 transition-all h-11",
                aiOpen && "bg-primary/10 text-primary border-primary"
              )}
              onClick={() => { setAiOpen(!aiOpen); setMobileOpen(false); }}
            >
              <Bot size={20} className={cn(aiOpen && "animate-pulse text-primary")} />
              <span className="font-semibold">AI Assistant</span>
            </Button>

            {/* Quick export row */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5"
                onClick={() => exportClientsCsv(data.clients)}
                title="Export clients CSV"
              >
                <Download size={13} /> Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5"
                onClick={() => exportPaymentsCsv(data.payments, data.clients)}
                title="Export invoices CSV"
              >
                <FileText size={13} /> Invoices
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={handleBackup}
                title="Download full DB backup"
              >
                <RotateCcw size={13} />
              </Button>
            </div>

            {/* Full PDF report */}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs gap-1.5"
              onClick={() => exportFullReportPdf(data.clients, data.websites, data.payments, data.tasks, data.reminders)}
            >
              <FileText size={13} /> Full Agency Report (PDF)
            </Button>

            {/* Email Digest */}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs gap-1.5 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary/80 hover:text-primary"
              onClick={handleSendDigest}
              disabled={digestSending}
              title="Send daily digest email"
            >
              {digestSending
                ? <><Loader2 size={13} className="animate-spin" /> Sending&hellip;</>
                : <><Mail size={13} /> Send Daily Digest</>
              }
            </Button>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-primary rounded-full transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </Button>

            {/* Notification center */}
            <NotificationCenter />

            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-sm font-bold text-foreground">TGNE Admin</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden hover:border-primary transition-all cursor-pointer">
              <Image src={logoUrl} alt="Profile" width={36} height={36} className="object-contain p-1" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background/50">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AIChat open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
