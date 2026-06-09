"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LogOut, Warehouse } from "lucide-react";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/contexts/auth-context";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  observer: "Observer",
  garage: "Manager",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "from-rose-500 to-rose-600",
  supervisor: "from-violet-500 to-violet-600",
  observer: "from-sky-500 to-sky-600",
  garage: "from-brand-500 to-brand-600",
};

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();
  const { user, permissions, logout } = useAuth();

  /* Filter nav items by role and permissions */
  const isGarageManager = user?.role === "garage";
  const visibleItems = navItems.filter((item) => {
    if (item.href === "/control-panel") return permissions.canManageUsers;
    if (item.href === "/settings") return permissions.canManageUsers;
    if (item.href === "/reports") return permissions.canViewReports;
    if (item.href === "/garages") return permissions.canManageUsers && !isGarageManager;
    if (item.adminOnly) return permissions.canManageUsers;
    return true;
  });

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "RG";

  const gradientColor = user ? (ROLE_COLORS[user.role] ?? "from-brand-500 to-brand-600") : "from-brand-500 to-brand-600";

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-surface-950/60 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "sidebar-gradient fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 text-white transition-[width,transform] duration-300 ease-out",
          isOpen ? "w-72" : "w-20",
          isMobile && !isOpen && "-translate-x-full",
          !isMobile && "translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 brand-glow">
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300",
              isOpen ? "opacity-100" : "w-0 opacity-0",
            )}
          >
            <p className="truncate text-base font-bold tracking-tight">Rider Garage</p>
            <p className="truncate text-xs text-slate-500">Delivery fleet hub</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {/* Garage manager: single link to their garage */}
          {isGarageManager && user?.garageId && (() => {
            const href = `/garages/${user.garageId}`;
            const isActive = pathname.startsWith("/garages/");
            return (
              <Link
                href={href}
                onClick={isMobile ? close : undefined}
                title={!isOpen ? "My Garage" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-500/20 text-brand-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-brand-500 text-white brand-glow"
                    : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white",
                )}>
                  <Warehouse className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className={cn(
                  "min-w-0 flex-1 overflow-hidden transition-all duration-300",
                  isOpen ? "opacity-100" : "w-0 opacity-0",
                )}>
                  <span className="block truncate">My Garage</span>
                  <span className="block truncate text-xs font-normal text-slate-500 group-hover:text-slate-400">
                    Bikes &amp; drivers
                  </span>
                </span>
                {isActive && isOpen && (
                  <span className="absolute right-3 h-2 w-2 rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })()}

          {/* Regular nav items for all roles */}
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? close : undefined}
                title={!isOpen ? item.title : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-500/20 text-brand-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-brand-500 text-white brand-glow"
                      : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <span
                  className={cn(
                    "min-w-0 flex-1 overflow-hidden transition-all duration-300",
                    isOpen ? "opacity-100" : "w-0 opacity-0",
                  )}
                >
                  <span className="block truncate">{item.title}</span>
                  <span className="block truncate text-xs font-normal text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </span>
                </span>

                {isActive && isOpen && (
                  <span className="absolute right-3 h-2 w-2 rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-white/10 p-3 space-y-2">
          {user && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 overflow-hidden transition-all",
                isOpen ? "bg-white/5" : "justify-center"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white",
                  gradientColor
                )}
              >
                {initials}
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1 overflow-hidden transition-all duration-300",
                  isOpen ? "opacity-100" : "w-0 opacity-0"
                )}
              >
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-500/20 hover:text-rose-300",
              isOpen ? "flex-1" : "w-full"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn("truncate transition-all duration-300", isOpen ? "opacity-100" : "w-0 opacity-0")}>
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
});
