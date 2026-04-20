"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { 
  Users, 
  Globe, 
  CreditCard, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Sparkles,
  Zap,
  Activity,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const { data } = useApp();
  const totalRevenue = useMemo(() => 
    data.websites.reduce((sum, w) => sum + (w.paymentStatus === 'Paid' ? (w.projectPrice || 0) : 0), 0)
  , [data.websites]);

  const pendingRevenue = useMemo(() => 
    data.websites.reduce((sum, w) => sum + (w.paymentStatus === 'Unpaid' ? (w.projectPrice || 0) : 0), 0)
  , [data.websites]);
  
  const stats = [
    { label: 'Total Clients', value: data.clients.length, icon: Users, trend: '+2 this month', color: 'text-primary' },
    { label: 'Active Websites', value: data.websites.length, icon: Globe, trend: 'All systems live', color: 'text-emerald-500' },
    { label: 'Completed Tasks', value: data.tasks.filter(t => t.status === 'Completed').length, icon: CheckSquare, trend: `${data.tasks.filter(t => t.status !== 'Completed').length} pending`, color: 'text-violet-500' },
    { label: 'Total Revenue', value: `GHS ${totalRevenue.toLocaleString()}`, icon: CreditCard, trend: `+GHS ${pendingRevenue.toLocaleString()} pending`, color: 'text-amber-500' },
  ];

  // Build chart from real payment data grouped by month
  const chartData = useMemo(() => {
    const monthTotals: Record<string, number> = {};
    data.payments
      .filter(p => p.status === 'PAID')
      .forEach(p => {
        const d = new Date(p.paymentDate);
        if (isNaN(d.getTime())) return;
        const key = d.toLocaleString('default', { month: 'short' });
        monthTotals[key] = (monthTotals[key] || 0) + p.amount;
      });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const entries = Object.entries(monthTotals);
    if (entries.length === 0) {
      return months.slice(0, 5).map(name => ({ name, revenue: 0 }));
    }
    return entries
      .sort((a, b) => months.indexOf(a[0]) - months.indexOf(b[0]))
      .map(([name, revenue]) => ({ name, revenue }));
  }, [data.payments]);

  const upcomingRenewals = data.websites
    .filter(w => w.expiryDate)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 3);

  // Generate dynamic AI Insight based on real data
  const aiInsight = useMemo(() => {
    if (data.clients.length === 0) return "Welcome to TGNE CORE. Start by adding your first client to generate insights.";
    
    const overduePayments = data.payments.filter(p => p.status === 'PENDING').length;
    const soonExpiring = data.websites.filter(w => {
      if (!w.expiryDate) return false;
      const diff = new Date(w.expiryDate).getTime() - new Date().getTime();
      return diff > 0 && diff < (30 * 24 * 60 * 60 * 1000); // 30 days
    }).length;

    if (overduePayments > 0) {
      return `Attention required: You have ${overduePayments} pending invoices. I recommend sending follow-up emails to maintain healthy cash flow.`;
    }
    if (soonExpiring > 0) {
      return `Good job! All invoices are paid. However, ${soonExpiring} domains are expiring within 30 days. Let's start the renewal process.`;
    }
    return `Revenue is holding steady at GHS ${totalRevenue.toLocaleString()}. You're doing great! Your next goal could be increasing your client base by 10%.`;
  }, [data, totalRevenue]);

  const recentActivity = useMemo(() => {
    const items = [
      ...data.clients.map(c => ({ label: `New Client: ${c.businessName}`, time: c.createdAt })),
      ...data.payments.map(p => ({ label: `Invoice ${p.status === 'PAID' ? 'Paid' : 'Pending'}: GHS ${p.amount}`, time: p.createdAt })),
      ...data.tasks.filter(t => t.status === 'Completed').map(t => ({ label: `Task Done: ${t.description}`, time: t.dueDate || '' })),
    ]
    .filter(i => i.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);
    return items;
  }, [data]);

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              Project Pulse <Zap className="text-primary animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Central command for your digital agency operations.</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 font-bold shadow-sm">
               Live Sync Active
             </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="premium-card bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-3xl font-bold mt-2 text-foreground">{stat.value}</h3>
                      <p className={cn("text-xs mt-2 flex items-center gap-1 font-semibold", stat.color)}>
                        <TrendingUp size={12} />
                        {stat.trend}
                      </p>
                    </div>
                    <div className={cn("p-4 rounded-2xl bg-muted/50 border", stat.color)}>
                      <Icon size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 premium-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Financial Growth</CardTitle>
              <Badge variant="secondary" className="bg-muted px-3 py-1 font-bold">FY 2024</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border))', 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
                      }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="url(#lineGradient)" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 3, stroke: 'hsl(var(--background))' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log - NEW */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivity.length > 0 ? recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 border-b border-muted pb-4 last:border-0 last:pb-0">
                    <div className="p-2 bg-muted rounded-full">
                      <History size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.time).toLocaleDateString()} • Verified Action
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No activity recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Upcoming Renewals</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                {upcomingRenewals.map((renewal) => (
                  <div key={renewal.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{renewal.domainName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{renewal.expiryDate || 'No date set'}</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                      READY
                    </Badge>
                  </div>
                ))}
                {upcomingRenewals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p className="text-sm font-medium">No renewals found.</p>
                  </div>
                )}
               </div>
            </CardContent>
           </Card>

           <Card className="premium-card bg-primary/5 border-primary/20 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={22} className="text-primary animate-pulse" />
                AI Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
               <p className="text-base text-foreground/90 leading-relaxed font-medium italic">
                "{aiInsight}"
               </p>
               <Button className="mt-6 w-full premium-button bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/20" asChild>
                 <Link href="/tasks">View Action Plan</Link>
               </Button>
            </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
