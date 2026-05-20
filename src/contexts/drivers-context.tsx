"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Driver } from "@/types/driver";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

type DriversContextValue = {
  drivers: Driver[];
  loading: boolean;
  addDriver: (driver: Omit<Driver, "id">) => Promise<string>;
  updateDriver: (id: string, changes: Partial<Omit<Driver, "id">>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
};

const DriversContext = createContext<DriversContextValue | null>(null);

export function DriversProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const driversRef = ref(db, "drivers");
    const unsub = onValue(driversRef, (snap) => {
      const data = snap.val() as Record<string, Omit<Driver, "id">> | null;
      setDrivers(data ? Object.entries(data).map(([id, d]) => ({ ...d, id })) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addDriver = useCallback(async (driver: Omit<Driver, "id">): Promise<string> => {
    const newRef = push(ref(db, "drivers"));
    await set(newRef, stripUndefined(driver));
    return newRef.key!;
  }, []);

  const updateDriver = useCallback(async (id: string, changes: Partial<Omit<Driver, "id">>) => {
    await update(ref(db, `drivers/${id}`), stripUndefined(changes));
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    await remove(ref(db, `drivers/${id}`));
  }, []);

  return (
    <DriversContext.Provider value={{ drivers, loading, addDriver, updateDriver, deleteDriver }}>
      {children}
    </DriversContext.Provider>
  );
}

export function useDrivers() {
  const ctx = useContext(DriversContext);
  if (!ctx) throw new Error("useDrivers must be used within DriversProvider");
  return ctx;
}
