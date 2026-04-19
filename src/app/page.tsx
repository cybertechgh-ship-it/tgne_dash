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
  Sparkles
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
    { label: 'Total Clients', value: data.clients.length, icon: Users, trend: '+2 this month', color: 'text-blue-600' },
    { label: 'Active Websites', value: data.websites.length, icon: Globe, trend: 'All systems live', color: 'text-green-600' },
    { label: 'Completed Tasks', value: data.tasks.filter(t => t.status === 'Completed').length, icon: CheckSquare, trend: '3 pending', color: 'text-purple-600' },
    { label: 'Total Revenue', value: `$${totalRevenue}`, icon: CreditCard, trend: `+$${pendingRevenue} pending`, color: 'text-emerald-600' },
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening with your projects.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <TrendingUp size={12} className="text-green-500" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
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
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Revenue Growth</CardTitle>
              <Badge variant="secondary">Current Year</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Renewals */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Renewals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {upcomingRenewals.map((renewal) => (
                  <div key={renewal.id} className="flex items-start gap-4">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                      <Calendar size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{renewal.domainName}</p>
                      <p className="text-xs text-muted-foreground">{renewal.expiryDate}</p>
                    </div>
                    <Badge variant={new Date(renewal.expiryDate!) < new Date() ? 'destructive' : 'outline'}>
                      {new Date(renewal.expiryDate!) < new Date() ? 'Expired' : 'Soon'}
                    </Badge>
                  </div>
                ))}
                {upcomingRenewals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertCircle size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No upcoming renewals found.</p>
                  </div>
                )}
                <button className="w-full text-center text-sm text-primary font-medium hover:underline mt-4">
                  View all renewals
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Client Snippets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="divide-y">
                {data.clients.slice(-3).map((client) => (
                  <div key={client.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="font-semibold">{client.businessName}</p>
                      <p className="text-xs text-muted-foreground">{client.name} • {client.email}</p>
                    </div>
                    <Link href="/clients" className="p-2 hover:bg-muted rounded-full text-primary transition-colors">
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                ))}
               </div>
            </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles size={20} className="text-accent" />
                AI Strategy Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-sm opacity-90 leading-relaxed">
                "Based on your recent activity, client <strong>Jenkins Bakery</strong> has an unpaid invoice for <strong>$1,200</strong>. Their domain expires in 20 days. Would you like me to draft a reminder email?"
               </p>
               <Button variant="secondary" className="mt-4 w-full text-primary font-bold">Draft Reminder</Button>
            </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
