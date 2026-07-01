"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, LogIn, LogOut, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/notifications-context";
import { useAuth } from "@/contexts/auth-context";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { AppNotification } from "@/types/notification";

function NotificationIcon({ type }: { type: AppNotification["type"] }) {
  const isExit = type === "driver_exit";
  const Icon = isExit ? LogOut : LogIn;

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        isExit ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function NotificationBell() {
  const { permissions } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const canView =
    permissions.canViewDashboard ||
    permissions.canClockDriver ||
    permissions.canManageUsers;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  if (!canView) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-700 shadow-sm transition-all hover:bg-surface-50 hover:shadow-md active:scale-95",
          open && "border-brand-200 bg-brand-50 text-brand-700"
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
            <div>
              <h2 className="text-base font-bold text-surface-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500">{unreadCount} unread</p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-100 hover:text-slate-600"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2 border-b border-surface-100 px-3 py-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-surface-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          )}

          <div className="max-h-[min(70vh,420px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 text-slate-400">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-surface-900">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Driver exit and return alerts will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-surface-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50",
                        !notification.read && "bg-brand-50/60"
                      )}
                    >
                      <NotificationIcon type={notification.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm text-surface-900",
                              !notification.read && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
