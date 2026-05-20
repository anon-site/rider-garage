"use client";

import { ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-3xl p-10 text-center ring-1 ring-white/60">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-rose-300/20 to-rose-500/10 blur-2xl" />
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600 shadow-lg shadow-rose-200/40 ring-1 ring-white/50">
          <ShieldOff className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <h2 className="relative text-xl font-bold text-surface-900">Access Denied</h2>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
          You don&apos;t have permission to access this page. Contact your admin if you believe this is an error.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-95"
        >
          Go to Dashboard
        </button>
        <div className="relative mt-8 flex justify-center gap-1.5">
          <span className="h-1.5 w-8 rounded-full bg-rose-400" />
          <span className="h-1.5 w-3 rounded-full bg-rose-200" />
          <span className="h-1.5 w-3 rounded-full bg-rose-200" />
        </div>
      </div>
    </div>
  );
}
