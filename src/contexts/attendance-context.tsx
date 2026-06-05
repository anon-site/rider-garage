"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

type AttendanceContextValue = {
  records: AttendanceRecord[];
  loading: boolean;
  addRecord: (record: Omit<AttendanceRecord, "id">) => Promise<string>;
  updateRecord: (id: string, changes: Partial<Omit<AttendanceRecord, "id">>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsByDriver: (driverId: string) => AttendanceRecord[];
  getLatestRecord: (driverId: string) => AttendanceRecord | null;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const attRef = ref(db, "attendance");
    const unsub = onValue(attRef, (snap) => {
      const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
      setRecords(data ? Object.entries(data).map(([id, r]) => ({ ...r, id })) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addRecord = useCallback(async (record: Omit<AttendanceRecord, "id">): Promise<string> => {
    const newRef = push(ref(db, "attendance"));
    await set(newRef, stripUndefined(record));
    return newRef.key!;
  }, []);

  const updateRecord = useCallback(async (id: string, changes: Partial<Omit<AttendanceRecord, "id">>) => {
    await update(ref(db, `attendance/${id}`), stripUndefined(changes));
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    await remove(ref(db, `attendance/${id}`));
  }, []);

  const getRecordsByDriver = useCallback(
    (driverId: string) =>
      records
        .filter((r) => r.driverId === driverId)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()),
    [records]
  );

  const getLatestRecord = useCallback(
    (driverId: string): AttendanceRecord | null => {
      const sorted = records
        .filter((r) => r.driverId === driverId)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
      return sorted[0] ?? null;
    },
    [records]
  );

  const value = useMemo(
    () => ({ records, loading, addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord }),
    [records, loading, addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord]
  );

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}
