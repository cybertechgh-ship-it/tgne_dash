"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { 
  Bell, 
  Globe, 
  CreditCard, 
  Settings,
  CalendarDays,
  Check,
  Calendar as GoogleCalendarIcon,
  ChevronRight,
  ShieldCheck,
  Server,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function RemindersPage() {
  const { data, addReminder, deleteReminder } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: 'Web Management' as any,
    title: '',
    date: new Date().toISOString().split('T')[0],
    details: ''
  });

  const allReminders = [...data.reminders].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Domain': return <Globe size={18} />;
      case 'Hosting': return <Server size={18} />;
      case 'Web Management': return <Settings size={18} />;
      case 'Payment': return <CreditCard size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Domain': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Hosting': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Web Management': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Payment': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const generateGoogleCalendarUrl = (reminder: any) => {
    const title = encodeURIComponent(`[TGNE] ${reminder.title}`);
    const dateStr = reminder.date.replace(/-/g, '');
    const details = encodeURIComponent(reminder.details || `Automated management reminder via TGNE dashboard.`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&sf=true&output=xml`;
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    addReminder(newReminder);
    setIsAddOpen(false);
    setNewReminder({
      type: 'Web Management',
      title: '',
      date: new Date().toISOString().split('T')[0],
      details: ''
    });
  };

  const groups = {
    all: allReminders,
    web: allReminders.filter(r => r.type === 'Web Management'),
    domain: allReminders.filter(r => r.type === 'Domain'),
    hosting: allReminders.filter(r => r.type === 'Hosting'),
  };

  const ReminderList = ({ reminders }: { reminders: typeof allReminders }) => (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const isUrgent = new Date(reminder.date) < new Date();
        return (
          <Card key={reminder.id} className={cn(
            "group overflow-hidden premium-card border-l-4",
            isUrgent ? "border-l-destructive" : "border-l-primary"
          )}>
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl border", getTypeColor(reminder.type))}>
                  {getTypeIcon(reminder.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base">{reminder.title}</h4>
                    {isUrgent && <Badge variant="destructive" className="text-[10px] h-4">OVERDUE</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{reminder.details}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CalendarDays size={14} className="text-primary" />
                      Scheduled: {reminder.date}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-2">{reminder.type}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  className="flex-1 sm:flex-none gap-2 premium-button" 
                  size="sm"
                  asChild
                >
                  <a href={generateGoogleCalendarUrl(reminder)} target="_blank" rel="noopener noreferrer">
                    <GoogleCalendarIcon size={14} />
                    Sync GCal
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {reminders.length === 0 && (
        <div className="text-center py-24 bg-muted/5 border-2 border-dashed rounded-3xl">
          <ShieldCheck size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No alerts in this category.</p>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">TGNE Alert Center</h1>
            <p className="text-muted-foreground mt-2 text-lg">Centralized tracking for renewals and digital management.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg premium-button">
                  <Plus size={18} />
                  New Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Schedule Alert</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddReminder} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={v => setNewReminder({...newReminder, type: v as any})} defaultValue="Web Management">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                  <Button type="submit" className="w-full">Schedule Alert</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1.5 px-4 font-bold hidden sm:flex gap-2">
              <Check size={14} />
              Calendar Sync Active
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-8 h-12 gap-1 rounded-2xl border">
            <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Alerts</TabsTrigger>
            <TabsTrigger value="web" className="rounded-xl px-6 data-[state=active]:bg-amber-500 data-[state=active]:text-white">Web Management</TabsTrigger>
            <TabsTrigger value="domain" className="rounded-xl px-6 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Domain Renewals</TabsTrigger>
            <TabsTrigger value="hosting" className="rounded-xl px-6 data-[state=active]:bg-purple-500 data-[state=active]:text-white">Hosting Renewals</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ReminderList reminders={groups.all} />
          </TabsContent>
          <TabsContent value="web">
            <ReminderList reminders={groups.web} />
          </TabsContent>
          <TabsContent value="domain">
            <ReminderList reminders={groups.domain} />
          </TabsContent>
          <TabsContent value="hosting">
            <ReminderList reminders={groups.hosting} />
          </TabsContent>
        </Tabs>

        <Card className="bg-primary/5 border-primary/20 rounded-3xl overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="p-4 bg-primary/20 rounded-3xl text-primary animate-pulse">
              <GoogleCalendarIcon size={40} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold">Smart Calendar Integration</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                TGNE generates optimized tracking links for Google Calendar. 
                Each sync includes the renewal date, client business name, and specific service details to keep your agency schedule pristine.
              </p>
            </div>
            <Button variant="outline" className="gap-2 border-primary/30 text-primary font-bold px-8 h-12 rounded-2xl">
              Configuration Guide
              <ChevronRight size={18} />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
