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
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  addAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from "@/lib/attendance-mutations";
import type { AttendanceRecord } from "@/types/attendance";
import { useAuth } from "@/contexts/auth-context";

type AttendanceContextValue = {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [recordsByDriver, setRecordsByDriver] = useState<Map<string, AttendanceRecord[]>>(new Map());
  const [latestByDriver, setLatestByDriver] = useState<Map<string, AttendanceRecord | null>>(new Map());
  const { user } = useAuth();

  useEffect(() => {
    const attRef =
      user?.role === "garage" && user.garageId
        ? query(ref(db, "attendance"), orderByChild("garageId"), equalTo(user.garageId))
        : ref(db, "attendance");

    const unsub = onValue(
      attRef,
      (snap) => {
        const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
        setRecords(data ? Object.entries(data).map(([id, r]) => ({ ...r, id })) : []);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.garageId, user?.role]);

  // Build fast indexes whenever the global records change so lookups are O(1)
  useEffect(() => {
    const byDriver = new Map<string, AttendanceRecord[]>();
    const latest = new Map<string, AttendanceRecord | null>();

    for (const r of records) {
      let list = byDriver.get(r.driverId);
      if (!list) {
        list = [];
        byDriver.set(r.driverId, list);
      }
      list.push(r);
    }

    for (const [driverId, list] of byDriver.entries()) {
      list.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
      latest.set(driverId, list[0] ?? null);
    }

    setRecordsByDriver(byDriver);
    setLatestByDriver(latest);
  }, [records]);

  const addRecord = useCallback(async (record: Omit<AttendanceRecord, "id">): Promise<string> => {
    return addAttendanceRecord(record);
  }, []);

  const updateRecord = useCallback(async (id: string, changes: Partial<Omit<AttendanceRecord, "id">>) => {
    await updateAttendanceRecord(id, changes);
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    await deleteAttendanceRecord(id);
  }, []);

  const getRecordsByDriver = useCallback(
    (driverId: string) => recordsByDriver.get(driverId) ?? [],
    [recordsByDriver]
  );

  const getLatestRecord = useCallback(
    (driverId: string): AttendanceRecord | null => latestByDriver.get(driverId) ?? null,
    [latestByDriver]
  );

  const value = useMemo(
    () => ({ records, loading, error, addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord }),
    [records, loading, error, addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord]
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
