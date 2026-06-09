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
import type { Bike } from "@/types/bike";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function generateBikeId(existingIds: string[]): string {
  const prefix = "BK-";
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, "0")}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, "0")}`;
  }
  return newId;
}

type BikesContextValue = {
  bikes: Bike[];
  loading: boolean;
  addBike: (bike: Omit<Bike, "id">, customId?: string) => Promise<string>;
  updateBike: (id: string, changes: Partial<Omit<Bike, "id">>) => Promise<void>;
  changeBikeId: (oldId: string, newId: string) => Promise<void>;
  deleteBike: (id: string) => Promise<void>;
};

const BikesContext = createContext<BikesContextValue | null>(null);

export function BikesProvider({ children }: { children: ReactNode }) {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bikesRef = ref(db, "bikes");
    const unsub = onValue(bikesRef, (snap) => {
      const data = snap.val() as Record<string, Omit<Bike, "id">> | null;
      setBikes(data ? Object.entries(data).map(([id, b]) => ({ ...b, id })) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addBike = useCallback(async (bike: Omit<Bike, "id">, customId?: string): Promise<string> => {
    const bikeId = customId || generateBikeId(bikes.map(b => b.id));
    const bikeRef = ref(db, `bikes/${bikeId}`);
    await set(bikeRef, stripUndefined(bike));

    // If driver assigned, update driver record with bikeId
    if (bike.driverId) {
      await update(ref(db, `drivers/${bike.driverId}`), { bikeId });
    }

    return bikeId;
  }, [bikes]);

  const updateBike = useCallback(async (id: string, changes: Partial<Omit<Bike, "id">>) => {
    // If driverId changed, update old and new driver records
    if (changes.driverId !== undefined) {
      // Get current bike data to find old driver
      const bikeSnap = await get(ref(db, `bikes/${id}`));
      const currentData = bikeSnap.val() as Bike | null;
      const oldDriverId = currentData?.driverId;

      // Remove bikeId from old driver
      if (oldDriverId && oldDriverId !== changes.driverId) {
        await update(ref(db, `drivers/${oldDriverId}`), { bikeId: null });
      }

      // Add bikeId to new driver
      if (changes.driverId) {
        await update(ref(db, `drivers/${changes.driverId}`), { bikeId: id });
      }
    }

    await update(ref(db, `bikes/${id}`), stripUndefined(changes));
  }, []);

  const changeBikeId = useCallback(async (oldId: string, newId: string) => {
    const oldRef = ref(db, `bikes/${oldId}`);
    const newRef = ref(db, `bikes/${newId}`);
    const snapshot = await get(oldRef);
    if (!snapshot.exists()) throw new Error("Bike not found");
    const data = snapshot.val();
    await set(newRef, data);
    await remove(oldRef);

    // Update driver reference if bike has a driver
    if (data.driverId) {
      await update(ref(db, `drivers/${data.driverId}`), { bikeId: newId });
    }
  }, []);

  const deleteBike = useCallback(async (id: string) => {
    // Get bike data to check if it has a driver
    const bikeSnap = await get(ref(db, `bikes/${id}`));
    const bikeData = bikeSnap.val() as Bike | null;

    // Remove bikeId from driver if assigned
    if (bikeData?.driverId) {
      await update(ref(db, `drivers/${bikeData.driverId}`), { bikeId: null });
    }

    await remove(ref(db, `bikes/${id}`));
  }, []);

  return (
    <BikesContext.Provider value={{ bikes, loading, addBike, updateBike, changeBikeId, deleteBike }}>
      {children}
    </BikesContext.Provider>
  );
}

export function useBikes() {
  const ctx = useContext(BikesContext);
  if (!ctx) throw new Error("useBikes must be used within BikesProvider");
  return ctx;
}
