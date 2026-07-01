"use client";

import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild, startAt, endAt } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";

export type UseAttendanceRangeResult = {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
};

/**
 * Fetch attendance records whose clockIn falls within a given ISO date range.
 * Both bounds are inclusive. Passing `null` for either bound disables that side.
 * Requires `indexOn` on `clockIn` in database rules.
 */
export function useAttendanceRange(
  startDate: string | null,
  endDate: string | null
): UseAttendanceRangeResult {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const attRef = ref(db, "attendance");
    let constrainedRef = query(attRef, orderByChild("clockIn"));

    if (startDate && endDate) {
      constrainedRef = query(constrainedRef, startAt(startDate), endAt(endDate));
    } else if (startDate) {
      constrainedRef = query(constrainedRef, startAt(startDate));
    } else if (endDate) {
      constrainedRef = query(constrainedRef, endAt(endDate));
    }

    const unsub = onValue(
      constrainedRef,
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
  }, [startDate, endDate]);

  return { records, loading, error };
}
