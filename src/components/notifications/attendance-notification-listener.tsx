"use client";

import { useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useDrivers } from "@/contexts/drivers-context";
import { useToast } from "@/components/ui/toast";
import { useNotifications } from "@/contexts/notifications-context";
import type { AttendanceRecord } from "@/types/attendance";
import { isAttendanceNotificationSuppressed } from "@/lib/attendance-notification-suppress";
import { notifyDriverMovement } from "@/lib/driver-movement-notify";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function driverName(drivers: { id: string; name: string }[], driverId: string) {
  return drivers.find((d) => d.id === driverId)?.name ?? driverId;
}

export function AttendanceNotificationListener() {
  const { drivers } = useDrivers();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const prevRecordsRef = useRef<Map<string, AttendanceRecord>>(new Map());
  const initializedRef = useRef(false);
  const driversRef = useRef(drivers);
  const toastRef = useRef(toast);
  const addNotificationRef = useRef(addNotification);

  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    const attRef = ref(db, "attendance");

    const unsub = onValue(attRef, (snap) => {
      const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
      const current = new Map<string, AttendanceRecord>();

      if (data) {
        for (const [id, record] of Object.entries(data)) {
          current.set(id, { ...record, id });
        }
      }

      if (!initializedRef.current) {
        prevRecordsRef.current = current;
        initializedRef.current = true;
        return;
      }

      const names = driversRef.current;

      for (const [id, record] of current) {
        if (!prevRecordsRef.current.has(id) && !isAttendanceNotificationSuppressed(id)) {
          notifyDriverMovement({
            kind: "exit",
            driverId: record.driverId,
            driverName: driverName(names, record.driverId),
            time: formatTime(record.clockIn),
            recordId: id,
            toast: toastRef.current,
            addNotification: addNotificationRef.current,
          });
        }
      }

      for (const [id, record] of current) {
        const prev = prevRecordsRef.current.get(id);
        if (
          prev &&
          !prev.clockOut &&
          record.clockOut &&
          !isAttendanceNotificationSuppressed(id)
        ) {
          notifyDriverMovement({
            kind: "entry",
            driverId: record.driverId,
            driverName: driverName(names, record.driverId),
            time: formatTime(record.clockOut),
            recordId: id,
            toast: toastRef.current,
            addNotification: addNotificationRef.current,
          });
        }
      }

      prevRecordsRef.current = current;
    });

    return () => unsub();
  }, []);

  return null;
}
