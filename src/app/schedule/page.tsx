
"use client";

import React, { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getCalApi } from "@calcom/embed-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Sparkles } from 'lucide-react';

export default function SchedulePage() {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK || 'augustine-nyaaba-mrol6e';

  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "auto",
        styles: { branding: { brandColor: "#8b5cf6" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              Scheduler <CalendarDays className="text-primary" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Book strategy sessions and project updates with ease.</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3">
            <Sparkles className="text-primary animate-pulse" size={24} />
            <span className="text-sm font-bold text-primary">Synced with Cal.com</span>
          </div>
        </div>

        <Card className="premium-card overflow-hidden h-[700px]">
          <CardContent className="p-0 h-full">
            <iframe
              src={`https://cal.com/${calLink}`}
              title="Cal.com Scheduler"
              className="w-full h-full border-none"
              allow="geolocation; microphone; camera; payment"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-accent/30 border border-white/5">
            <h3 className="font-bold text-lg mb-2">Automated Invites</h3>
            <p className="text-sm text-muted-foreground">Meeting invites are automatically sent to both you and your client upon booking.</p>
          </div>
          <div className="p-6 rounded-3xl bg-accent/30 border border-white/5">
            <h3 className="font-bold text-lg mb-2">Buffer Times</h3>
            <p className="text-sm text-muted-foreground">Pre-configured 15-minute buffers ensure you have time to prep between clients.</p>
          </div>
          <div className="p-6 rounded-3xl bg-accent/30 border border-white/5">
            <h3 className="font-bold text-lg mb-2">G-Calendar Sync</h3>
            <p className="text-sm text-muted-foreground">All appointments are mirrored to your primary agency calendar instantly.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
