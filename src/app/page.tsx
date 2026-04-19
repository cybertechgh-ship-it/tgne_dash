"use client";

import React from 'react';
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
  Zap
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

  const totalRevenue = data.websites.reduce((sum, w) => sum + (w.paymentStatus === 'Paid' ? w.projectPrice : 0), 0);
  const pendingRevenue = data.websites.reduce((sum, w) => sum + (w.paymentStatus === 'Unpaid' ? w.projectPrice : 0), 0);
  
  const stats = [
    { label: 'Total Clients', value: data.clients.length, icon: Users, trend: '+2 this month', color: 'text-primary' },
    { label: 'Active Websites', value: data.websites.length, icon: Globe, trend: 'All systems live', color: 'text-emerald-500' },
    { label: 'Completed Tasks', value: data.tasks.filter(t => t.status === 'Completed').length, icon: CheckSquare, trend: '3 pending', color: 'text-violet-500' },
    { label: 'Total Revenue', value: `$${totalRevenue}`, icon: CreditCard, trend: `+$${pendingRevenue} pending`, color: 'text-amber-500' },
  ];

  const chartData = [
    { name: 'Oct', revenue: 1500 },
    { name: 'Nov', revenue: 2700 },
    { name: 'Dec', revenue: 3200 },
    { name: 'Jan', revenue: 4500 },
    { name: 'Feb', revenue: totalRevenue },
  ];

  const upcomingRenewals = data.websites
    .filter(w => w.expiryDate)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 3);

  return (
    <DashboardLayout>
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
               Session Active: 10m
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

          {/* Upcoming Renewals */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Urgent Renewals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {upcomingRenewals.map((renewal) => (
                  <div key={renewal.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{renewal.domainName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{renewal.expiryDate}</p>
                    </div>
                    <Badge 
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5",
                        new Date(renewal.expiryDate!) < new Date() ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      )}
                    >
                      {new Date(renewal.expiryDate!) < new Date() ? 'EXPIRED' : 'ACTIVE'}
                    </Badge>
                  </div>
                ))}
                {upcomingRenewals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertCircle size={32} className="mb-2 opacity-20 text-primary" />
                    <p className="text-sm font-medium">No renewal tasks today.</p>
                  </div>
                )}
                <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 font-bold mt-4 h-12 rounded-xl border border-dashed border-primary/20">
                  View Full Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">New Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                {data.clients.slice(-3).map((client) => (
                  <div key={client.id} className="p-4 rounded-2xl flex items-center justify-between hover:bg-muted/50 border border-transparent hover:border-border transition-all group">
                    <div>
                      <p className="font-bold text-foreground text-lg">{client.businessName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>
                    </div>
                    <Link href="/clients" className="p-2.5 bg-primary/10 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm">
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                ))}
               </div>
            </CardContent>
           </Card>

           <Card className="premium-card bg-primary/5 border-primary/20 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={22} className="text-primary animate-pulse" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
               <p className="text-base text-foreground/90 leading-relaxed font-medium">
                "Growth detected! Revenue is up <span className="text-emerald-600 font-bold">12%</span> this month. You have one overdue invoice for <strong>Jenkins Bakery</strong>. Automated follow-up suggested."
               </p>
               <Button className="mt-6 w-full premium-button bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/20">
                 Execute Action Plan
               </Button>
            </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
