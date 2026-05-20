"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/contexts/auth-context";

type HeaderProps = {
  title: string;
  description?: string;
};

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin:      { label: "Admin",      cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  supervisor: { label: "Supervisor", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  observer:   { label: "Observer",   cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  garage:     { label: "Manager",    cls: "bg-brand-50 text-brand-700 ring-brand-200" },
};

const ROLE_AVATAR: Record<string, string> = {
  admin:      "from-rose-500 to-rose-600",
  supervisor: "from-violet-500 to-violet-600",
  observer:   "from-sky-500 to-sky-600",
  garage:     "from-brand-500 to-brand-600",
};

export function Header({ title, description }: HeaderProps) {
  const { toggle } = useSidebar();
  const { user } = useAuth();

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "RG";

  const badge = user ? (ROLE_BADGE[user.role] ?? ROLE_BADGE.observer) : null;
  const avatarGrad = user ? (ROLE_AVATAR[user.role] ?? "from-brand-500 to-brand-600") : "from-brand-500 to-brand-600";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/60 bg-white/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-800 shadow-sm transition-all hover:bg-surface-100 hover:shadow-md active:scale-95 lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-surface-900 sm:text-xl">
            {title}
          </h1>
          {description && (
            <p className="hidden truncate text-sm text-slate-500 sm:block">{description}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {badge && (
          <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 sm:inline-flex ${badge.cls}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {badge.label}
          </span>
        )}
        {user && (
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-semibold text-surface-900 leading-tight">{user.name}</span>
            <span className="text-[11px] text-slate-400">{user.email}</span>
          </div>
        )}
        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-md shadow-brand-200/40 ${avatarGrad}`}>
          {initials}
        </div>
      </div>
    </header>
  );
}
