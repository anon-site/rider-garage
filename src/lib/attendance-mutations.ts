import { ref, push, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types/attendance";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export async function addAttendanceRecord(
  record: Omit<AttendanceRecord, "id">
): Promise<string> {
  const newRef = push(ref(db, "attendance"));
  await set(newRef, stripUndefined(record));
  return newRef.key!;
}

export async function updateAttendanceRecord(
  id: string,
  changes: Partial<Omit<AttendanceRecord, "id">>
): Promise<void> {
  await update(ref(db, `attendance/${id}`), stripUndefined(changes));
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  await remove(ref(db, `attendance/${id}`));
}
