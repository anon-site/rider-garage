"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  defaultTab?: string;
};

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className="space-y-6">
      <div className="glass-panel inline-flex rounded-2xl p-1.5 ring-1 ring-white/60">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-brand-600 text-white shadow-md shadow-brand-200/40"
                  : "text-slate-500 hover:bg-white/60 hover:text-surface-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{activeContent}</div>
    </div>
  );
}
