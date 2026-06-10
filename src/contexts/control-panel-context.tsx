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
} from "firebase/database";
import { db } from "@/lib/firebase";
import type { User } from "@/types/user";
import type { Garage } from "@/types/garage";
import type { DeliveryCategory } from "@/types/delivery-category";
import { DELIVERY_CATEGORIES } from "@/types/delivery-category";

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

function generateUserId(existingIds: string[]): string {
  const prefix = "USR-";
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, "0")}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, "0")}`;
  }
  return newId;
}

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

type ControlPanelContextValue = {
  users: User[];
  garages: Garage[];
  deliveryCategories: DeliveryCategory[];
  loading: boolean;
  addUser: (user: Omit<User, "id">, customId?: string) => Promise<string>;
  updateUser: (id: string, changes: Partial<Omit<User, "id">>) => Promise<void>;
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

const ControlPanelContext = createContext<ControlPanelContextValue | null>(null);

export function ControlPanelProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [deliveryCategories, setDeliveryCategories] = useState<DeliveryCategory[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Real-time listeners ── */
  useEffect(() => {
    let usersReady = false;
    let garagesReady = false;
    let deliveryCategoriesReady = false;

    const checkDone = () => {
      if (usersReady && garagesReady && deliveryCategoriesReady) setLoading(false);
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

    const deliveryCategoriesRef = ref(db, "deliveryCategories");
    const unsubDeliveryCategories = onValue(deliveryCategoriesRef, (snap) => {
      const data = snap.val() as Record<string, Omit<DeliveryCategory, "id">> | null;
      if (data) {
        setDeliveryCategories(Object.entries(data).map(([id, c]) => ({ ...c, id })));
      } else {
        // Seed default delivery categories on first run
        const seedCategories = DELIVERY_CATEGORIES;
        const promises = seedCategories.map(async (cat) => {
          const catRef = push(ref(db, "deliveryCategories"));
          await set(catRef, cat);
          return { ...cat, id: catRef.key! };
        });
        Promise.all(promises).then((seeded) => {
          setDeliveryCategories(seeded);
        });
      }
      deliveryCategoriesReady = true;
      checkDone();
    });

    return () => {
      unsubUsers();
      unsubGarages();
      unsubDeliveryCategories();
    };
  }, []);

  /* ── Users CRUD ── */
  const addUser = useCallback(async (user: Omit<User, "id">, customId?: string): Promise<string> => {
    const userId = customId || generateUserId(users.map(u => u.id));
    const userRef = ref(db, `users/${userId}`);
    await set(userRef, stripUndefined(user));
    if (user.garageId) {
      await update(ref(db, `garages/${user.garageId}`), { managerId: userId });
    }
    return userId;
  }, [users]);

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

  const changeUserId = useCallback(async (oldId: string, newId: string) => {
    const oldRef = ref(db, `users/${oldId}`);
    const newRef = ref(db, `users/${newId}`);
    const snapshot = await get(oldRef);
    if (!snapshot.exists()) throw new Error("User not found");
    const data = snapshot.val();
    await set(newRef, data);
    await remove(oldRef);

    // Update garage reference if user is a manager
    if (data.garageId) {
      await update(ref(db, `garages/${data.garageId}`), { managerId: newId });
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user?.garageId) {
      await update(ref(db, `garages/${user.garageId}`), { managerId: null });
    }
    await remove(ref(db, `users/${id}`));
  }, [users]);

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
      const drivers = driversSnap.val() as Record<string, { deliveryCategoryId?: string }>;
      const driversUsingCategory = Object.entries(drivers).filter(([, driver]) => driver.deliveryCategoryId === id);
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
