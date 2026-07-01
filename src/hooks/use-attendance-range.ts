"use client";

import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild, startAt, endAt, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";
import { useAuth } from "@/contexts/auth-context";

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
  const { user } = useAuth();
  const userRole = user?.role;
  const userGarageId = user?.garageId;

  useEffect(() => {
    if (userRole === "observer") {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const isGarageScope = userRole === "garage" && !!userGarageId;
    const attRef = ref(db, "attendance");
    let constrainedRef = isGarageScope
      ? query(attRef, orderByChild("garageId"), equalTo(userGarageId!))
      : query(attRef, orderByChild("clockIn"));

    if (!isGarageScope && startDate && endDate) {
      constrainedRef = query(constrainedRef, startAt(startDate), endAt(endDate));
    } else if (!isGarageScope && startDate) {
      constrainedRef = query(constrainedRef, startAt(startDate));
    } else if (!isGarageScope && endDate) {
      constrainedRef = query(constrainedRef, endAt(endDate));
    }

    const unsub = onValue(
      constrainedRef,
      (snap) => {
        const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
        const allRecords = data ? Object.entries(data).map(([id, r]) => ({ ...r, id })) : [];
        const filtered = isGarageScope
          ? allRecords.filter((record) => {
              if (startDate && record.clockIn < startDate) return false;
              if (endDate && record.clockIn > endDate) return false;
              return true;
            })
          : allRecords;
        setRecords(filtered);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [endDate, startDate, userGarageId, userRole]);

  return { records, loading, error };
}
