"use client";

import { useEffect, useRef } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useDrivers } from "@/contexts/drivers-context";
import { useNotifications } from "@/contexts/notifications-context";
import { useToast } from "@/components/ui/toast";
import type { AttendanceRecord } from "@/types/attendance";
import { getLastActiveTime, setLastActiveTime } from "@/lib/notification-last-active";
import { syncMissedNotifications } from "@/lib/sync-missed-notifications";
import type { AppNotification } from "@/types/notification";

function getStoredNotificationKeys(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`rider-garage-notifications-${userId}`);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.map((n) => `${n.type}:${n.recordId}`));
  } catch {
    return new Set();
  }
}

export function MissedNotificationsSync() {
  const { user } = useAuth();
  const { drivers, loading: driversLoading } = useDrivers();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const syncedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || driversLoading) return;
    if (syncedForUserRef.current === user.id) return;

    const userId = user.id;
    const subscriber = { id: user.id, role: user.role, garageId: user.garageId };
    let cancelled = false;

    async function runSync() {
      const sinceIso = getLastActiveTime(userId);
      const snap = await get(ref(db, "attendance"));
      if (cancelled) return;

      const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
      const records = new Map<string, AttendanceRecord>();

      if (data) {
        for (const [id, record] of Object.entries(data)) {
          records.set(id, { ...record, id });
        }
      }

      const existingKeys = getStoredNotificationKeys(userId);

      const added = syncMissedNotifications({
        records,
        drivers,
        user: subscriber,
        sinceIso,
        existingKeys,
        addNotification,
      });

      setLastActiveTime(userId);
      syncedForUserRef.current = userId;

      if (added > 0) {
        toast(
          "info",
          added === 1
            ? "1 driver update while you were away"
            : `${added} driver updates while you were away`
        );
      }
    }

    void runSync();

    return () => {
      cancelled = true;
    };
  }, [user, drivers, driversLoading, addNotification, toast]);

  useEffect(() => {
    if (!user?.id) {
      syncedForUserRef.current = null;
    }
  }, [user?.id]);

  return null;
}
