"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  ref,
  onValue,
  push,
  set,
  update,
  remove,
} from "firebase/database";
import { db } from "@/lib/firebase";
import type { User } from "@/types/user";
import type { Garage } from "@/types/garage";

/* ── seed admin on first run ────────────────────────────────────── */
const SEED_ADMIN: Omit<User, "id"> = {
  name: "Ahmed Hassan",
  username: "ahmed",
  password: "admin123",
  email: "ahmed@ridergarage.com",
  phone: "+964 770 123 4567",
  role: "admin",
};

/* ── helpers ── */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

type ControlPanelContextValue = {
  users: User[];
  garages: Garage[];
  loading: boolean;
  addUser: (user: Omit<User, "id">) => Promise<string>;
  updateUser: (id: string, changes: Partial<Omit<User, "id">>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addGarage: (garage: Omit<Garage, "id">) => Promise<string>;
  updateGarage: (id: string, changes: Partial<Omit<Garage, "id">>) => Promise<void>;
  deleteGarage: (id: string) => Promise<void>;
};

const ControlPanelContext = createContext<ControlPanelContextValue | null>(null);

export function ControlPanelProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Real-time listeners ── */
  useEffect(() => {
    let usersReady = false;
    let garagesReady = false;

    const checkDone = () => {
      if (usersReady && garagesReady) setLoading(false);
    };

    const usersRef = ref(db, "users");
    const unsubUsers = onValue(usersRef, (snap) => {
      const data = snap.val() as Record<string, Omit<User, "id">> | null;
      if (data) {
        setUsers(Object.entries(data).map(([id, u]) => ({ ...u, id })));
      } else {
        /* Seed admin on first run */
        const adminRef = push(ref(db, "users"));
        set(adminRef, SEED_ADMIN);
        setUsers([{ ...SEED_ADMIN, id: adminRef.key! }]);
      }
      usersReady = true;
      checkDone();
    });

    const garagesRef = ref(db, "garages");
    const unsubGarages = onValue(garagesRef, (snap) => {
      const data = snap.val() as Record<string, Omit<Garage, "id">> | null;
      setGarages(data ? Object.entries(data).map(([id, g]) => ({ ...g, id })) : []);
      garagesReady = true;
      checkDone();
    });

    return () => {
      unsubUsers();
      unsubGarages();
    };
  }, []);

  /* ── Users CRUD ── */
  const addUser = useCallback(async (user: Omit<User, "id">): Promise<string> => {
    const newRef = push(ref(db, "users"));
    await set(newRef, stripUndefined(user));
    const newId = newRef.key!;
    if (user.garageId) {
      await update(ref(db, `garages/${user.garageId}`), { managerId: newId });
    }
    return newId;
  }, []);

  const updateUser = useCallback(async (id: string, changes: Partial<Omit<User, "id">>) => {
    const oldUser = users.find((u) => u.id === id);
    await update(ref(db, `users/${id}`), stripUndefined(changes));

    const newGarageId = changes.garageId !== undefined ? changes.garageId : oldUser?.garageId;

    if (oldUser?.garageId && oldUser.garageId !== newGarageId) {
      await update(ref(db, `garages/${oldUser.garageId}`), { managerId: null });
    }
    if (newGarageId) {
      await update(ref(db, `garages/${newGarageId}`), { managerId: id });
    }
    if (changes.garageId === undefined && oldUser?.garageId) {
      await update(ref(db, `users/${id}`), { garageId: null });
    }
  }, [users]);

  const deleteUser = useCallback(async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user?.garageId) {
      await update(ref(db, `garages/${user.garageId}`), { managerId: null });
    }
    await remove(ref(db, `users/${id}`));
  }, [users]);

  /* ── Garages CRUD ── */
  const addGarage = useCallback(async (garage: Omit<Garage, "id">): Promise<string> => {
    const newRef = push(ref(db, "garages"));
    await set(newRef, stripUndefined(garage));
    const newId = newRef.key!;
    if (garage.managerId) {
      await update(ref(db, `users/${garage.managerId}`), { garageId: newId });
    }
    return newId;
  }, []);

  const updateGarage = useCallback(async (id: string, changes: Partial<Omit<Garage, "id">>) => {
    const oldGarage = garages.find((g) => g.id === id);
    await update(ref(db, `garages/${id}`), stripUndefined(changes));

    const newManagerId = changes.managerId !== undefined ? changes.managerId : oldGarage?.managerId;

    if (oldGarage?.managerId && oldGarage.managerId !== newManagerId) {
      await update(ref(db, `users/${oldGarage.managerId}`), { garageId: null });
    }
    if (newManagerId) {
      await update(ref(db, `users/${newManagerId}`), { garageId: id });
    }
  }, [garages]);

  const deleteGarage = useCallback(async (id: string) => {
    const garage = garages.find((g) => g.id === id);
    if (garage?.managerId) {
      await update(ref(db, `users/${garage.managerId}`), { garageId: null });
    }
    await remove(ref(db, `garages/${id}`));
  }, [garages]);

  return (
    <ControlPanelContext.Provider
      value={{
        users, garages, loading,
        addUser, updateUser, deleteUser,
        addGarage, updateGarage, deleteGarage,
      }}
    >
      {children}
    </ControlPanelContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(ControlPanelContext);
  if (!ctx) throw new Error("useUsers must be used within ControlPanelProvider");
  const { users, loading, addUser, updateUser, deleteUser } = ctx;
  return { users, loading, addUser, updateUser, deleteUser };
}

export function useGarages() {
  const ctx = useContext(ControlPanelContext);
  if (!ctx) throw new Error("useGarages must be used within ControlPanelProvider");
  const { garages, loading, addGarage, updateGarage, deleteGarage } = ctx;
  return { garages, loading, addGarage, updateGarage, deleteGarage };
}
