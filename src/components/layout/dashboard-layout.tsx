
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
  Download, 
  RotateCcw,
  Menu,
  Sun,
  Moon,
  LogOut,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import { AIChat } from '@/components/ai/ai-chat';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Credentials', href: '/credentials', icon: KeyRound },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'Schedule', href: '/schedule', icon: CalendarDays },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { exportData, resetData, isAuthorized, logout } = useApp();

  useEffect(() => {
    if (!isAuthorized && pathname !== '/tgnes') {
      router.push('/tgnes');
    }
  }, [isAuthorized, pathname, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const logoUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png";

  if (!isAuthorized && pathname !== '/tgnes') {
    return (
      <div className="h-screen w-full bg-[#02040a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform lg:translate-x-0 lg:static",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl border bg-white flex items-center justify-center">
              <Image 
                src={logoUrl} 
                alt="TGNE Logo" 
                fill 
                className="object-contain p-1"
                priority
              />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-primary">TGNE</span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start gap-3 rounded-xl border-primary/20 hover:border-primary/50 transition-all",
                aiOpen && "bg-primary/10 text-primary border-primary"
              )}
              onClick={() => {
                setAiOpen(!aiOpen);
                setMobileOpen(false);
              }}
            >
              <Bot size={20} className={cn(aiOpen && "animate-pulse")} />
              <span>AI Assistant</span>
            </Button>
            
            <div className="pt-4 space-y-1">
              <button 
                onClick={exportData}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download size={14} />
                <span>Export Data</span>
              </button>
              <button 
                onClick={() => resetData()}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset Demo</span>
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <LogOut size={14} />
                <span>Lock Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <button className="lg:hidden p-2 text-muted-foreground" onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">TGNE Admin</span>
              <span className="text-xs text-muted-foreground">Pro Account</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white overflow-hidden border">
               <Image 
                src={logoUrl} 
                alt="Profile" 
                width={40} 
                height={40} 
                className="object-cover"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AIChat open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
