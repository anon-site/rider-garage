"use client";

import { Zap } from "lucide-react";

export function AppLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-300">
          <Zap className="h-9 w-9 text-white" fill="currentColor" />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </span>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-surface-900">Rider Garage</p>
          <p className="mt-1 text-sm text-slate-400">Connecting to database…</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
