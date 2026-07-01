"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  areBrowserNotificationsEnabled,
  disableBrowserNotifications,
  enableBrowserNotifications,
  getBrowserNotificationPreference,
  isBrowserNotificationSupported,
} from "@/lib/browser-notifications";
import { isFcmConfigured } from "@/lib/fcm";
import {
  areNotificationSoundsEnabled,
  playAttendanceSound,
  setNotificationSoundsEnabled,
  unlockNotificationAudio,
} from "@/lib/notification-sounds";

export function BrowserNotificationsSection() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isBrowserNotificationSupported());
    setSoundsEnabled(areNotificationSoundsEnabled());
    if (!isBrowserNotificationSupported()) return;
    setPermission(Notification.permission);
    setEnabled(areBrowserNotificationsEnabled());
  }, []);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const result = await enableBrowserNotifications(user?.id);
    setPermission(result.permission);
    setEnabled(result.ok);
    if (result.ok) {
      setMessage(
        result.pushRegistered
          ? "Push notifications enabled. You will receive alerts even when the browser is closed."
          : "Browser notifications are enabled. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY and deploy Cloud Functions for push when the browser is closed."
      );
    } else if (result.permission === "denied") {
      setMessage("Permission denied. Enable notifications in your browser site settings, then try again.");
    } else {
      setMessage("Notification permission was not granted.");
    }
    setLoading(false);
  }, [user?.id]);

  const handleDisable = useCallback(async () => {
    await disableBrowserNotifications(user?.id);
    setEnabled(false);
    setMessage("Browser notifications are turned off.");
  }, [user?.id]);

  const handleSoundsToggle = useCallback(() => {
    const next = !soundsEnabled;
    setNotificationSoundsEnabled(next);
    setSoundsEnabled(next);
    if (next) {
      unlockNotificationAudio();
      playAttendanceSound("entry");
    }
  }, [soundsEnabled]);

  const previewExitSound = useCallback(() => {
    unlockNotificationAudio();
    playAttendanceSound("exit");
  }, []);

  const previewEntrySound = useCallback(() => {
    unlockNotificationAudio();
    playAttendanceSound("entry");
  }, []);

  return (
    <div className="space-y-4">
      {/* Notification sounds */}
      <section className="glass-panel rounded-2xl p-5 ring-1 ring-white/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
              {soundsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-900">Notification Sounds</h3>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Play a sound when a driver leaves or returns to the garage. Exit uses a descending
                tone; return uses an ascending tone.
              </p>
              {soundsEnabled && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={previewExitSound}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                  >
                    Preview exit sound
                  </button>
                  <button
                    type="button"
                    onClick={previewEntrySound}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                  >
                    Preview return sound
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSoundsToggle}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition-colors",
              soundsEnabled
                ? "bg-violet-600 text-white ring-violet-600 hover:bg-violet-700"
                : "bg-surface-100 text-surface-800 ring-surface-200 hover:bg-surface-200"
            )}
          >
            {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundsEnabled ? "Sounds on" : "Sounds off"}
          </button>
        </div>
      </section>

      {/* Browser notifications */}
      {!supported ? (
        <section className="glass-panel rounded-2xl p-5 ring-1 ring-white/60">
          <div className="flex items-start gap-3">
            <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <div>
              <h3 className="text-sm font-bold text-surface-900">Browser Notifications</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your browser does not support desktop notifications.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="glass-panel rounded-2xl p-5 ring-1 ring-white/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900">Browser Notifications</h3>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Get alerts when drivers leave or return — even when this tab is in the background
                  {isFcmConfigured()
                    ? " or the browser is closed (after Cloud Functions are deployed)."
                    : "."}
                </p>
                {!isFcmConfigured() && (
                  <p className="mt-2 text-sm text-amber-700">
                    Add <code className="text-xs">NEXT_PUBLIC_FIREBASE_VAPID_KEY</code> in{" "}
                    <code className="text-xs">.env.local</code> and deploy Cloud Functions to unlock
                    push when the browser is closed.
                  </p>
                )}
                {permission === "denied" && (
                  <p className="mt-2 text-sm text-amber-700">
                    Notifications are blocked by your browser. Open site settings and allow
                    notifications for this website.
                  </p>
                )}
                {message && (
                  <p className={cn("mt-2 text-sm", enabled ? "text-emerald-700" : "text-slate-600")}>
                    {message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {enabled ? (
                <button
                  type="button"
                  onClick={handleDisable}
                  className="inline-flex items-center gap-2 rounded-xl bg-surface-100 px-4 py-2.5 text-sm font-semibold text-surface-800 ring-1 ring-surface-200 transition-colors hover:bg-surface-200"
                >
                  <BellOff className="h-4 w-4" />
                  Disable
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={loading || permission === "denied"}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200/40 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  Enable
                </button>
              )}
            </div>
          </div>

          {getBrowserNotificationPreference() === null && !enabled && permission === "default" && (
            <p className="mt-3 text-xs text-slate-400">
              Tip: managers and admins on other devices should enable this to catch driver movements
              while working in another tab.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
