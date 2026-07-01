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
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "@/lib/firebase";
import { authFetch } from "@/lib/auth-fetch";
import { toPublicUser } from "@/lib/user-profile";
import type { PublicUser } from "@/types/user";
import type { Garage } from "@/types/garage";
import type { DeliveryCategory } from "@/types/delivery-category";
import { DELIVERY_CATEGORIES } from "@/types/delivery-category";
import { useAuth } from "@/contexts/auth-context";

/* ── helpers ── */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export type CreateUserInput = Omit<PublicUser, "id"> & { password: string };
export type UpdateUserInput = Partial<Omit<PublicUser, "id">> & { password?: string };

type ControlPanelContextValue = {
  users: PublicUser[];
  garages: Garage[];
  deliveryCategories: DeliveryCategory[];
  loading: boolean;
  addUser: (user: CreateUserInput, customId?: string) => Promise<string>;
  updateUser: (id: string, changes: UpdateUserInput) => Promise<void>;
  changeUserId: (oldId: string, newId: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addGarage: (garage: Omit<Garage, "id">, customId?: string) => Promise<string>;
  updateGarage: (id: string, changes: Partial<Omit<Garage, "id">>) => Promise<void>;
  changeGarageId: (oldId: string, newId: string) => Promise<void>;
  deleteGarage: (id: string) => Promise<void>;
  addDeliveryCategory: (category: Omit<DeliveryCategory, "id">, customId?: string) => Promise<string>;
  updateDeliveryCategory: (id: string, changes: Partial<Omit<DeliveryCategory, "id">>) => Promise<void>;
  changeDeliveryCategoryId: (oldId: string, newId: string) => Promise<void>;
  deleteDeliveryCategory: (id: string) => Promise<void>;
};

function generateGarageId(existingIds: string[]): string {
  const prefix = "GRG-";
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, "0")}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, "0")}`;
  }
  return newId;
}

function generateDeliveryCategoryId(existingIds: string[]): string {
  const prefix = "DC-";
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, "0")}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, "0")}`;
  }
  return newId;
}

const ControlPanelContext = createContext<ControlPanelContextValue | null>(null);

export function ControlPanelProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [deliveryCategories, setDeliveryCategories] = useState<DeliveryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  /* ── Real-time listeners ── */
  useEffect(() => {
    let usersReady = false;
    let garagesReady = false;
    let deliveryCategoriesReady = false;

    const checkDone = () => {
      if (usersReady && garagesReady && deliveryCategoriesReady) setLoading(false);
    };

    let unsubUsers: () => void = () => {};
    if (user?.role === "admin") {
      const usersRef = ref(db, "users");
      unsubUsers = onValue(usersRef, (snap) => {
        const data = snap.val() as Record<string, Record<string, unknown>> | null;
        if (data) {
          setUsers(Object.entries(data).map(([id, u]) => toPublicUser(id, u)));
        } else {
          setUsers([]);
        }
        usersReady = true;
        checkDone();
      });
    } else {
      setUsers([]);
      usersReady = true;
      checkDone();
    }

    let unsubGarages: () => void = () => {};
    if (user?.role === "observer") {
      setGarages([]);
      garagesReady = true;
      checkDone();
    } else {
      const garagesRef =
        user?.role === "garage"
          ? query(ref(db, "garages"), orderByChild("managerId"), equalTo(user.id))
          : ref(db, "garages");
      unsubGarages = onValue(garagesRef, (snap) => {
        const data = snap.val() as Record<string, Omit<Garage, "id">> | null;
        setGarages(data ? Object.entries(data).map(([id, g]) => ({ ...g, id })) : []);
        garagesReady = true;
        checkDone();
      });
    }

    const deliveryCategoriesRef = ref(db, "deliveryCategories");
    const unsubDeliveryCategories = onValue(deliveryCategoriesRef, (snap) => {
      const data = snap.val() as Record<string, Omit<DeliveryCategory, "id">> | null;
      if (data) {
        setDeliveryCategories(Object.entries(data).map(([id, c]) => ({ ...c, id })));
      } else {
        DELIVERY_CATEGORIES.forEach(async (cat) => {
          const catRef = push(ref(db, "deliveryCategories"));
          await set(catRef, cat);
        });
        setDeliveryCategories([]);
      }
      deliveryCategoriesReady = true;
      checkDone();
    });

    return () => {
      unsubUsers();
      unsubGarages();
      unsubDeliveryCategories();
    };
  }, [user?.id, user?.role]);

  /* ── Users CRUD (server-side for credentials) ── */
  const addUser = useCallback(async (user: CreateUserInput, customId?: string): Promise<string> => {
    const response = await authFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ...user, id: customId }),
    });
    const data = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to create user.");
    return data.id!;
  }, []);

  const updateUser = useCallback(async (id: string, changes: UpdateUserInput) => {
    const response = await authFetch(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to update user.");
  }, []);

  const changeUserId = useCallback(async (oldId: string, newId: string) => {
    const response = await authFetch(`/api/users/${oldId}`, {
      method: "PATCH",
      body: JSON.stringify({ newId }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to change user ID.");
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    const response = await authFetch(`/api/users/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to delete user.");
  }, []);

  /* ── Garages CRUD ── */
  const addGarage = useCallback(async (garage: Omit<Garage, "id">, customId?: string): Promise<string> => {
    const garageId = customId || generateGarageId(garages.map(g => g.id));
    const garageRef = ref(db, `garages/${garageId}`);
    await set(garageRef, stripUndefined(garage));
    if (garage.managerId) {
      await update(ref(db, `users/${garage.managerId}`), { garageId: garageId });
    }
    return garageId;
  }, [garages]);

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

  const changeGarageId = useCallback(async (oldId: string, newId: string) => {
    const oldRef = ref(db, `garages/${oldId}`);
    const newRef = ref(db, `garages/${newId}`);
    const snapshot = await get(oldRef);
    if (!snapshot.exists()) throw new Error("Garage not found");
    const data = snapshot.val();
    await set(newRef, data);
    await remove(oldRef);

    // Update user reference if garage has a manager
    if (data.managerId) {
      await update(ref(db, `users/${data.managerId}`), { garageId: newId });
    }
  }, []);

  const deleteGarage = useCallback(async (id: string) => {
    const garage = garages.find((g) => g.id === id);
    if (garage?.managerId) {
      await update(ref(db, `users/${garage.managerId}`), { garageId: null });
    }
    await remove(ref(db, `garages/${id}`));
  }, [garages]);

  /* ── Delivery Categories CRUD ── */
  const addDeliveryCategory = useCallback(async (category: Omit<DeliveryCategory, "id">, customId?: string): Promise<string> => {
    const categoryId = customId || generateDeliveryCategoryId(deliveryCategories.map(c => c.id));
    const categoryRef = ref(db, `deliveryCategories/${categoryId}`);
    await set(categoryRef, stripUndefined(category));
    return categoryId;
  }, [deliveryCategories]);

  const updateDeliveryCategory = useCallback(async (id: string, changes: Partial<Omit<DeliveryCategory, "id">>) => {
    await update(ref(db, `deliveryCategories/${id}`), stripUndefined(changes));
  }, []);

  const changeDeliveryCategoryId = useCallback(async (oldId: string, newId: string) => {
    const oldRef = ref(db, `deliveryCategories/${oldId}`);
    const newRef = ref(db, `deliveryCategories/${newId}`);
    const snapshot = await get(oldRef);
    if (!snapshot.exists()) throw new Error("Delivery category not found");
    const data = snapshot.val();
    await set(newRef, data);
    await remove(oldRef);
  }, []);

  const deleteDeliveryCategory = useCallback(async (id: string) => {
    // Check if any drivers are using this category
    const driversRef = ref(db, "drivers");
    const driversSnap = await get(driversRef);
    if (driversSnap.exists()) {
      const drivers = driversSnap.val() as Record<string, { deliveryCategoryIds?: string[]; deliveryCategoryId?: string }>;
      const driversUsingCategory = Object.entries(drivers).filter(([, driver]) => {
        const ids = driver.deliveryCategoryIds || [];
        return ids.includes(id) || driver.deliveryCategoryId === id;
      });
      if (driversUsingCategory.length > 0) {
        throw new Error(`Cannot delete delivery category: ${driversUsingCategory.length} driver(s) are using it`);
      }
    }
    await remove(ref(db, `deliveryCategories/${id}`));
  }, []);

  return (
    <ControlPanelContext.Provider
      value={{
        users, garages, deliveryCategories, loading,
        addUser, updateUser, changeUserId, deleteUser,
        addGarage, updateGarage, changeGarageId, deleteGarage,
        addDeliveryCategory, updateDeliveryCategory, changeDeliveryCategoryId, deleteDeliveryCategory,
      }}
    >
      {children}
    </ControlPanelContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(ControlPanelContext);
  if (!ctx) throw new Error("useUsers must be used within ControlPanelProvider");
  const { users, loading, addUser, updateUser, changeUserId, deleteUser } = ctx;
  return { users, loading, addUser, updateUser, changeUserId, deleteUser };
}

export function useGarages() {
  const ctx = useContext(ControlPanelContext);
  if (!ctx) throw new Error("useGarages must be used within ControlPanelProvider");
  const { garages, loading, addGarage, updateGarage, changeGarageId, deleteGarage } = ctx;
  return { garages, loading, addGarage, updateGarage, changeGarageId, deleteGarage };
}

export function useDeliveryCategories() {
  const ctx = useContext(ControlPanelContext);
  if (!ctx) throw new Error("useDeliveryCategories must be used within ControlPanelProvider");
  const { deliveryCategories, loading, addDeliveryCategory, updateDeliveryCategory, changeDeliveryCategoryId, deleteDeliveryCategory } = ctx;
  return { deliveryCategories, loading, addDeliveryCategory, updateDeliveryCategory, changeDeliveryCategoryId, deleteDeliveryCategory };
}
