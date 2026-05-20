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
import type { Bike } from "@/types/bike";

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

type BikesContextValue = {
  bikes: Bike[];
  loading: boolean;
  addBike: (bike: Omit<Bike, "id">) => Promise<string>;
  updateBike: (id: string, changes: Partial<Omit<Bike, "id">>) => Promise<void>;
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

  const addBike = useCallback(async (bike: Omit<Bike, "id">): Promise<string> => {
    const newRef = push(ref(db, "bikes"));
    await set(newRef, stripUndefined(bike));
    return newRef.key!;
  }, []);

  const updateBike = useCallback(async (id: string, changes: Partial<Omit<Bike, "id">>) => {
    await update(ref(db, `bikes/${id}`), stripUndefined(changes));
  }, []);

  const deleteBike = useCallback(async (id: string) => {
    await remove(ref(db, `bikes/${id}`));
  }, []);

  return (
    <BikesContext.Provider value={{ bikes, loading, addBike, updateBike, deleteBike }}>
      {children}
    </BikesContext.Provider>
  );
}

export function useBikes() {
  const ctx = useContext(BikesContext);
  if (!ctx) throw new Error("useBikes must be used within BikesProvider");
  return ctx;
}
