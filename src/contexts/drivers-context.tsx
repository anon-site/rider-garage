"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ref, onValue, push, set, update, remove, get } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Driver } from "@/types/driver";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function generateDriverId(existingIds: string[]): string {
  const prefix = "DRV-";
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, "0")}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, "0")}`;
  }
  return newId;
}

type DriversContextValue = {
  drivers: Driver[];
  loading: boolean;
  addDriver: (driver: Omit<Driver, "id">, customId?: string) => Promise<string>;
  updateDriver: (id: string, changes: Partial<Omit<Driver, "id">>) => Promise<void>;
  changeDriverId: (oldId: string, newId: string) => Promise<void>;
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

  const addDriver = useCallback(async (driver: Omit<Driver, "id">, customId?: string): Promise<string> => {
    const driverId = customId || generateDriverId(drivers.map(d => d.id));
    const driverRef = ref(db, `drivers/${driverId}`);
    await set(driverRef, stripUndefined(driver));

    // If bike assigned, update bike record with driverId
    if (driver.bikeId) {
      await update(ref(db, `bikes/${driver.bikeId}`), { driverId });
    }

    return driverId;
  }, [drivers]);

  const updateDriver = useCallback(async (id: string, changes: Partial<Omit<Driver, "id">>) => {
    // If bikeId changed, update old and new bike records
    if (changes.bikeId !== undefined) {
      // Get current driver data to find old bike
      const driverSnap = await get(ref(db, `drivers/${id}`));
      const currentData = driverSnap.val() as Driver | null;
      const oldBikeId = currentData?.bikeId;

      // Remove driverId from old bike
      if (oldBikeId && oldBikeId !== changes.bikeId) {
        await update(ref(db, `bikes/${oldBikeId}`), { driverId: null });
      }

      // Add driverId to new bike
      if (changes.bikeId) {
        await update(ref(db, `bikes/${changes.bikeId}`), { driverId: id });
      }
    }

    await update(ref(db, `drivers/${id}`), stripUndefined(changes));
  }, []);

  const changeDriverId = useCallback(async (oldId: string, newId: string) => {
    const oldRef = ref(db, `drivers/${oldId}`);
    const newRef = ref(db, `drivers/${newId}`);
    const snapshot = await get(oldRef);
    if (!snapshot.exists()) throw new Error("Driver not found");
    const data = snapshot.val();
    await set(newRef, data);
    await remove(oldRef);
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    // Get driver data to check if they have a bike
    const driverSnap = await get(ref(db, `drivers/${id}`));
    const driverData = driverSnap.val() as Driver | null;

    // Remove driverId from bike if assigned
    if (driverData?.bikeId) {
      await update(ref(db, `bikes/${driverData.bikeId}`), { driverId: null });
    }

    await remove(ref(db, `drivers/${id}`));
  }, []);

  return (
    <DriversContext.Provider value={{ drivers, loading, addDriver, updateDriver, changeDriverId, deleteDriver }}>
      {children}
    </DriversContext.Provider>
  );
}

export function useDrivers() {
  const ctx = useContext(DriversContext);
  if (!ctx) throw new Error("useDrivers must be used within DriversProvider");
  return ctx;
}
