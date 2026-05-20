"use client";

import { useState, useCallback } from "react";
import { Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportExportSection } from "./import-export-section";
import type { SiteData } from "@/lib/data-io";

type SettingsTab = "data";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "data", label: "Import & Export", icon: Download },
];

type SettingsSectionProps = {
  onImport: (data: Partial<SiteData>) => void;
};

export function SettingsSection({ onImport }: SettingsSectionProps) {
  const [tab, setTab] = useState<SettingsTab>("data");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="glass-panel inline-flex rounded-2xl p-1.5 ring-1 ring-white/60">
        <nav className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                  tab === t.id
                    ? "bg-brand-600 text-white shadow-md shadow-brand-200/40"
                    : "text-slate-500 hover:bg-white/60 hover:text-surface-900"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "data" && <ImportExportSection onImport={onImport} />}
    </div>
  );
}
