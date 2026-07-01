"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppNotification, AppNotificationType } from "@/types/notification";
import { useAuth } from "@/contexts/auth-context";

const MAX_NOTIFICATIONS = 50;

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (input: {
    type: AppNotificationType;
    title: string;
    message: string;
    driverId: string;
    recordId: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function storageKey(userId: string) {
  return `rider-garage-notifications-${userId}`;
}

function createNotification(input: {
  type: AppNotificationType;
  title: string;
  message: string;
  driverId: string;
  recordId: string;
}): AppNotification {
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: input.type,
    title: input.title,
    message: input.message,
    driverId: input.driverId,
    recordId: input.recordId,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey(user.id));
      if (!raw) {
        setNotifications([]);
        return;
      }
      const parsed = JSON.parse(raw) as AppNotification[];
      setNotifications(Array.isArray(parsed) ? parsed : []);
    } catch {
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(notifications));
  }, [notifications, user?.id]);

  const addNotification = useCallback(
    (input: {
      type: AppNotificationType;
      title: string;
      message: string;
      driverId: string;
      recordId: string;
    }) => {
      if (!user?.id) return;

      const item = createNotification(input);
      setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));
    },
    [user?.id]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
