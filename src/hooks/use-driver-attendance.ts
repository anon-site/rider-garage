"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ref, onValue, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";
import { useAuth } from "@/contexts/auth-context";

const PAGE_SIZE = 25;

type UseDriverAttendanceResult = {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
};

export function useDriverAttendance(driverId: string | null): UseDriverAttendanceResult {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const userRole = user?.role;
  const userGarageId = user?.garageId;

  useEffect(() => {
    if (!driverId || userRole === "observer") {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const isGarageScope = userRole === "garage" && !!userGarageId;
    const q = isGarageScope
      ? query(ref(db, "attendance"), orderByChild("garageId"), equalTo(userGarageId!))
      : query(
          ref(db, "attendance"),
          orderByChild("driverId"),
          equalTo(driverId),
          limitToLast(limit)
        );
    const unsub = onValue(
      q,
      (snap) => {
        const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
        const allRecords = data ? Object.entries(data).map(([id, r]) => ({ ...r, id })) : [];
        const filtered = isGarageScope
          ? allRecords.filter((record) => record.driverId === driverId).slice(-limit)
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
  }, [driverId, limit, userGarageId, userRole]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()),
    [records]
  );

  // If the query returned exactly the requested limit, there may be more
  // records on the server. Clicking "Load more" will fetch the next batch.
  const hasMore = records.length === limit;

  const loadMore = useCallback(() => {
    setLimit((prev) => prev + PAGE_SIZE);
  }, []);

  return { records: sortedRecords, loading, error, hasMore, loadMore };
}
