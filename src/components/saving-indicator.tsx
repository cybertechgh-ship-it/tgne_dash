"use client";

import { useApp } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function SavingIndicator() {
  const { isSaving } = useApp();

  if (!isSaving) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-semibold tracking-wide">Saving</span>
      </div>
    </div>
  );
}