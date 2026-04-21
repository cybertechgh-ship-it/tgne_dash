"use client";

import { useApp } from "@/lib/store";
import { Loader2, Save, Trash2, Pencil } from "lucide-react";

export function SavingIndicator() {
  const { savingState } = useApp();

  if (!savingState) return null;

  const configs = {
    saving: {
      bg:   "bg-primary",
      text: "text-primary-foreground",
      icon: <Save className="w-4 h-4" />,
      label: "Saving…",
    },
    deleting: {
      bg:   "bg-red-600",
      text: "text-white",
      icon: <Trash2 className="w-4 h-4" />,
      label: "Deleting…",
    },
    updating: {
      bg:   "bg-amber-500",
      text: "text-white",
      icon: <Pencil className="w-4 h-4" />,
      label: "Updating…",
    },
  };

  const cfg = configs[savingState as keyof typeof configs] ?? configs.saving;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className={`flex items-center gap-2 px-4 py-2.5 ${cfg.bg} ${cfg.text} rounded-full shadow-lg`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {cfg.icon}
        <span className="text-sm font-semibold tracking-wide">{cfg.label}</span>
      </div>
    </div>
  );
}
