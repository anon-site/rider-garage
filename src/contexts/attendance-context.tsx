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
import { ref, push, set, update, remove, get } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// Helper function to get month/year path for attendance
function getAttendancePath(year: number, month: number): string {
  return `attendance/${year}/${String(month).padStart(2, "0")}`;
}

// Helper function to get current month/year
function getCurrentMonthYear(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

type AttendanceContextValue = {
  records: AttendanceRecord[];
  loading: boolean;
  currentMonth: { year: number; month: number };
  loadMonth: (year: number, month: number) => Promise<void>;
  loadCurrentMonth: () => Promise<void>;
  addRecord: (record: Omit<AttendanceRecord, "id">) => Promise<string>;
  updateRecord: (id: string, changes: Partial<Omit<AttendanceRecord, "id">>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsByDriver: (driverId: string) => AttendanceRecord[];
  getLatestRecord: (driverId: string) => AttendanceRecord | null;
  getRecordsByMonth: (year: number, month: number) => Promise<AttendanceRecord[]>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());

  // Load records for a specific month/year
  const loadMonth = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const attRef = ref(db, getAttendancePath(year, month));
      const snapshot = await get(attRef);
      const data = snapshot.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
      
      const monthRecords = data 
        ? Object.entries(data).flatMap(([, driverRecords]) => {
            if (typeof driverRecords === 'object' && driverRecords !== null) {
              return Object.entries(driverRecords).map(([recordId, record]) => {
                // Safe type assertion: first cast to unknown, then to the expected type
                const recordObj = record as unknown as Omit<AttendanceRecord, "id">;
                return {
                  ...recordObj,
                  id: recordId,
                } as AttendanceRecord;
              });
            }
            return [];
          })
        : [];
      
      setRecords(monthRecords);
      setCurrentMonth({ year, month });
    } catch (error) {
      console.error('Error loading month records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load current month by default
  const loadCurrentMonth = useCallback(async () => {
    const { year, month } = getCurrentMonthYear();
    await loadMonth(year, month);
  }, [loadMonth]);

  // Initialize with current month
  useEffect(() => {
    loadCurrentMonth();
  }, [loadCurrentMonth]);

  const addRecord = useCallback(async (record: Omit<AttendanceRecord, "id">): Promise<string> => {
    // Get the year and month from the clockIn date
    const clockInDate = new Date(record.clockIn);
    const year = clockInDate.getFullYear();
    const month = clockInDate.getMonth() + 1;
    
    // Add to the new structure: attendance/year/month/driverId/recordId
    const newRef = push(ref(db, `${getAttendancePath(year, month)}/${record.driverId}`));
    await set(newRef, stripUndefined(record));
    
    // If this record is for the currently loaded month, refresh the data
    if (year === currentMonth.year && month === currentMonth.month) {
      await loadMonth(year, month);
    }
    
    return newRef.key!;
  }, [currentMonth, loadMonth]);

  const updateRecord = useCallback(async (id: string, changes: Partial<Omit<AttendanceRecord, "id">>) => {
    // Find the record to get its driverId and date info
    const recordToUpdate = records.find(r => r.id === id);
    if (!recordToUpdate) {
      throw new Error('Record not found');
    }
    
    const clockInDate = new Date(recordToUpdate.clockIn);
    const year = clockInDate.getFullYear();
    const month = clockInDate.getMonth() + 1;
    
    await update(
      ref(db, `${getAttendancePath(year, month)}/${recordToUpdate.driverId}/${id}`), 
      stripUndefined(changes)
    );
    
    // If this record is for the currently loaded month, refresh the data
    if (year === currentMonth.year && month === currentMonth.month) {
      await loadMonth(year, month);
    }
  }, [records, currentMonth, loadMonth]);

  const deleteRecord = useCallback(async (id: string) => {
    // Find the record to get its driverId and date info
    const recordToDelete = records.find(r => r.id === id);
    if (!recordToDelete) {
      throw new Error('Record not found');
    }
    
    const clockInDate = new Date(recordToDelete.clockIn);
    const year = clockInDate.getFullYear();
    const month = clockInDate.getMonth() + 1;
    
    await remove(ref(db, `${getAttendancePath(year, month)}/${recordToDelete.driverId}/${id}`));
    
    // If this record is for the currently loaded month, refresh the data
    if (year === currentMonth.year && month === currentMonth.month) {
      await loadMonth(year, month);
    }
  }, [records, currentMonth, loadMonth]);

  // Get records by driver from the currently loaded month
  const getRecordsByDriver = useCallback(
    (driverId: string) =>
      records
        .filter((r) => r.driverId === driverId)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()),
    [records]
  );

  // Get latest record from the currently loaded month
  const getLatestRecord = useCallback(
    (driverId: string): AttendanceRecord | null => {
      const sorted = records
        .filter((r) => r.driverId === driverId)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
      return sorted[0] ?? null;
    },
    [records]
  );

  // Get records for any month (not just the loaded one)
  const getRecordsByMonth = useCallback(async (year: number, month: number): Promise<AttendanceRecord[]> => {
    try {
      const attRef = ref(db, getAttendancePath(year, month));
      const snapshot = await get(attRef);
      const data = snapshot.val() as Record<string, Omit<AttendanceRecord, "id">> | null;
      
      return data 
        ? Object.entries(data).flatMap(([, driverRecords]) => {
            if (typeof driverRecords === 'object' && driverRecords !== null) {
              return Object.entries(driverRecords).map(([recordId, record]) => {
                // Safe type assertion: first cast to unknown, then to the expected type
                const recordObj = record as unknown as Omit<AttendanceRecord, "id">;
                return {
                  ...recordObj,
                  id: recordId,
                } as AttendanceRecord;
              });
            }
            return [];
          })
        : [];
    } catch (error) {
      console.error('Error getting month records:', error);
      return [];
    }
  }, []);

  const value = useMemo(
    () => ({ 
      records, 
      loading, 
      currentMonth,
      loadMonth,
      loadCurrentMonth,
      addRecord, 
      updateRecord, 
      deleteRecord, 
      getRecordsByDriver, 
      getLatestRecord,
      getRecordsByMonth 
    }),
    [records, loading, currentMonth, loadMonth, loadCurrentMonth, addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord, getRecordsByMonth]
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
