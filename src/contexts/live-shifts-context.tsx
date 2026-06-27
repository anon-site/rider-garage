"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";

type LiveShiftsContextValue = {
  activeRecords: AttendanceRecord[];
  activeDriverIds: Set<string>;
  loading: boolean;
  error: string | null;
};

const LiveShiftsContext = createContext<LiveShiftsContextValue | null>(null);

export function LiveShiftsProvider({ children }: { children: ReactNode }) {
  const [activeRecords, setActiveRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only listen to records that are currently open (no clockOut).
    // This stays small even when historical attendance data grows huge.
    const activeRef = query(
      ref(db, "attendance"),
      orderByChild("clockOut"),
      equalTo(null)
    );
    const unsub = onValue(
      activeRef,
      (snap) => {
        const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
        setActiveRecords(data ? Object.entries(data).map(([id, r]) => ({ ...r, id })) : []);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const activeDriverIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of activeRecords) {
      set.add(r.driverId);
    }
    return set;
  }, [activeRecords]);

  const value = useMemo(
    () => ({ activeRecords, activeDriverIds, loading, error }),
    [activeRecords, activeDriverIds, loading, error]
  );

  return (
    <LiveShiftsContext.Provider value={value}>
      {children}
    </LiveShiftsContext.Provider>
  );
}

export function useLiveShifts() {
  const ctx = useContext(LiveShiftsContext);
  if (!ctx) throw new Error("useLiveShifts must be used within LiveShiftsProvider");
  return ctx;
}
