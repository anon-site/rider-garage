"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ref, onValue, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";

const PAGE_SIZE = 25;

type UseDriverAttendanceResult = {
  records: AttendanceRecord[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

export function useDriverAttendance(driverId: string | null): UseDriverAttendanceResult {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      ref(db, "attendance"),
      orderByChild("driverId"),
      equalTo(driverId),
      limitToLast(limit)
    );
    const unsub = onValue(q, (snap) => {
      const data = snap.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
      setRecords(data ? Object.entries(data).map(([id, r]) => ({ ...r, id })) : []);
      setLoading(false);
    });
    return () => unsub();
  }, [driverId, limit]);

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

  return { records: sortedRecords, loading, hasMore, loadMore };
}
