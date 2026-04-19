"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { 
  Bell, 
  Globe, 
  CreditCard, 
  AlertTriangle,
  CalendarDays,
  Check,
  Calendar as GoogleCalendarIcon,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function RemindersPage() {
  const { data } = useApp();

  // Combine reminders and generated ones from data
  const dynamicReminders = data.websites
    .filter(w => w.paymentStatus === 'Unpaid' || w.paymentStatus === 'Partial')
    .map(w => ({
      id: `p-${w.id}`,
      type: 'Payment' as const,
      title: `${w.paymentStatus === 'Partial' ? 'Partial' : 'Unpaid'}: ${w.domainName} Fee`,
      date: w.dateCreated,
      isRead: false,
      details: `Payment reminder for project ${w.domainName}. Total price: $${w.projectPrice}.`
    }));

  const allReminders = [...data.reminders, ...dynamicReminders].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Domain': return <Globe size={18} />;
      case 'Payment': return <CreditCard size={18} />;
      case 'Hosting': return <CalendarDays size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Domain': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Payment': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'Hosting': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const generateGoogleCalendarUrl = (reminder: any) => {
    const title = encodeURIComponent(reminder.title);
    const date = reminder.date.replace(/-/g, '');
    const details = encodeURIComponent(reminder.details || `DevDash automated reminder for ${reminder.title}`);
    // Create a 1-hour event
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}&sf=true&output=xml`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">System Reminders</h1>
            <p className="text-muted-foreground mt-1">Automatic alerts for renewals, payments, and deadlines.</p>
          </div>
          <Badge variant="outline" className="gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <Check size={14} />
            Live Sync Ready
          </Badge>
        </div>

        <div className="space-y-4">
          {allReminders.map((reminder) => {
            const reminderDate = new Date(reminder.date);
            const isUrgent = reminderDate < new Date();
            
            return (
              <Card key={reminder.id} className={cn(
                "border-none shadow-sm transition-all overflow-hidden premium-card",
                isUrgent && "border-l-4 border-l-destructive"
              )}>
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", getTypeColor(reminder.type))}>
                      {getTypeIcon(reminder.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base">{reminder.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays size={12} />
                          {reminder.date}
                        </span>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-[10px] h-4 py-0 font-bold uppercase tracking-wider">Overdue</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-none gap-2 text-xs font-bold hover:bg-primary hover:text-white transition-all"
                      asChild
                     >
                        <a href={generateGoogleCalendarUrl(reminder)} target="_blank" rel="noopener noreferrer">
                          <GoogleCalendarIcon size={14} />
                          Sync to GCal
                        </a>
                     </Button>
                     <Button variant="ghost" size="sm" className="flex-1 sm:flex-none text-xs text-muted-foreground">
                        Dismiss
                     </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {allReminders.length === 0 && (
             <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-muted">
                <Bell size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground font-medium">All quiet! No pending reminders.</p>
             </div>
          )}
        </div>
        
        <div className="glass-morphism rounded-2xl p-6 flex items-start gap-4 bg-primary/5 border-primary/20">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ExternalLink size={20} />
          </div>
          <div>
            <h4 className="font-bold text-primary">Google Calendar Integration</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Click "Sync to GCal" to immediately open your Google Calendar with pre-filled details. 
              The event will be set for the scheduled date of the reminder.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
