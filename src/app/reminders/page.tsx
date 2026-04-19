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
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RemindersPage() {
  const { data } = useApp();

  // Combine reminders and generated ones from data
  const dynamicReminders = data.websites
    .filter(w => w.paymentStatus === 'Unpaid')
    .map(w => ({
      id: `p-${w.id}`,
      type: 'Payment' as const,
      title: `Unpaid: ${w.domainName} Project Fee`,
      date: w.dateCreated,
      isRead: false
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
      case 'Domain': return 'bg-blue-100 text-blue-600';
      case 'Payment': return 'bg-red-100 text-red-600';
      case 'Hosting': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">System Reminders</h1>
          <p className="text-muted-foreground mt-1">Automatic alerts for renewals, payments, and deadlines.</p>
        </div>

        <div className="space-y-4">
          {allReminders.map((reminder) => {
            const isUrgent = new Date(reminder.date) < new Date();
            return (
              <Card key={reminder.id} className={cn(
                "border-none shadow-sm transition-all overflow-hidden",
                isUrgent && "border-l-4 border-l-destructive"
              )}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", getTypeColor(reminder.type))}>
                      {getTypeIcon(reminder.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{reminder.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{reminder.date}</span>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-[10px] h-4 py-0">Overdue</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
                        <Check size={14} />
                        Dismiss
                     </Button>
                     <Button variant="outline" size="sm" className="text-xs">
                        Details
                     </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {allReminders.length === 0 && (
             <div className="text-center py-20 bg-white/30 rounded-xl border border-dashed">
                <Bell size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground font-medium">All quiet! No pending reminders.</p>
             </div>
          )}
        </div>
        
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="text-accent shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-accent">Heads up!</h4>
            <p className="text-sm text-accent/80 mt-1">
              Automated reminders are currently simulated based on your project data. 
              In a production environment, these would trigger email or browser notifications.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { cn } from '@/lib/utils';