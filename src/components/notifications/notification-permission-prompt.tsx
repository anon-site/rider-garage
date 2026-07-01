"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  areBrowserNotificationsEnabled,
  enableBrowserNotifications,
  getBrowserNotificationPreference,
  isBrowserNotificationSupported,
  setBrowserNotificationPreference,
} from "@/lib/browser-notifications";
import { isFcmConfigured } from "@/lib/fcm";
import { unlockNotificationAudio } from "@/lib/notification-sounds";

const DISMISS_KEY = "rider-garage-notification-prompt-dismissed";

function shouldShowPrompt(): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (areBrowserNotificationsEnabled()) return false;
  if (getBrowserNotificationPreference() === "disabled") return false;
  if (Notification.permission === "denied") return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  return true;
}

export function NotificationPermissionPrompt() {
  const { user, permissions } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const canReceiveAlerts =
    permissions.canViewDashboard || permissions.canClockDriver || permissions.canManageUsers;

  useEffect(() => {
    if (!canReceiveAlerts) {
      setVisible(false);
      return;
    }
    setVisible(shouldShowPrompt());
  }, [canReceiveAlerts]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    unlockNotificationAudio();

    try {
      const result = await enableBrowserNotifications(
        user ? { id: user.id, role: user.role, garageId: user.garageId } : undefined
      );
      if (result.permission === "granted") {
        localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
      }
    } catch {
      if (Notification.permission === "granted") {
        setBrowserNotificationPreference("enabled");
        localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[190] w-[min(100vw-2rem,380px)] rounded-2xl border border-brand-200 bg-white p-4 shadow-xl ring-1 ring-black/5 sm:bottom-24 sm:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-surface-900">Enable driver alerts?</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Get notified when drivers leave or return — even when this tab is in the background
            {isFcmConfigured() ? " or the browser is closed." : "."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={loading}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Enabling…" : "Enable"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-surface-200 hover:bg-surface-50"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-surface-100 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
