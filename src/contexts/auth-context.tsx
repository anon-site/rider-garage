"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import type { PublicUser, RoleId } from "@/types/user";
import type { CustomPermissions } from "@/types/user";
import { auth, db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { toPublicUser } from "@/lib/user-profile";
import { recordFailedAttempt, recordSuccessfulLogin, getRemainingLockoutTime } from "@/lib/rate-limiter";

export type Permissions = {
  canEdit: boolean;
  canManageUsers: boolean;
  canClockDriver: boolean;
  canViewReports: boolean;
  canViewDashboard: boolean;
  canViewGarages: boolean;
  canViewBikes: boolean;
  canViewDrivers: boolean;
  canViewSettings: boolean;
};

const ROLE_PERMISSIONS: Record<RoleId, Permissions> = {
  admin: {
    canEdit: true,
    canManageUsers: true,
    canClockDriver: true,
    canViewReports: true,
    canViewDashboard: true,
    canViewGarages: true,
    canViewBikes: true,
    canViewDrivers: true,
    canViewSettings: true,
  },
  supervisor: {
    canEdit: false,
    canManageUsers: false,
    canClockDriver: false,
    canViewReports: true,
    canViewDashboard: true,
    canViewGarages: true,
    canViewBikes: true,
    canViewDrivers: true,
    canViewSettings: false,
  },
  observer: {
    canEdit: false,
    canManageUsers: false,
    canClockDriver: false,
    canViewReports: false,
    canViewDashboard: true,
    canViewGarages: false,
    canViewBikes: false,
    canViewDrivers: false,
    canViewSettings: false,
  },
  garage: {
    canEdit: false,
    canManageUsers: false,
    canClockDriver: true,
    canViewReports: false,
    canViewDashboard: true,
    canViewGarages: false,
    canViewBikes: false,
    canViewDrivers: false,
    canViewSettings: false,
  },
};

export type AuthContextValue = {
  user: PublicUser | null;
  permissions: Permissions;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<string | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const DEFAULT_PERMISSIONS: Permissions = {
  canEdit: false,
  canManageUsers: false,
  canClockDriver: false,
  canViewReports: false,
  canViewDashboard: false,
  canViewGarages: false,
  canViewBikes: false,
  canViewDrivers: false,
  canViewSettings: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const userId = (tokenResult.claims.userId as string | undefined) ?? firebaseUser.uid;
        const profileSnap = await get(ref(db, `users/${userId}`));

        if (!profileSnap.exists()) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        setUser(toPublicUser(userId, profileSnap.val() as Record<string, unknown>));
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const permissions = useMemo<Permissions>(() => {
    if (!user) return DEFAULT_PERMISSIONS;
    const base = ROLE_PERMISSIONS[user.role];
    if (!user.customPermissions) return base;
    const cp = user.customPermissions as CustomPermissions;
    return {
      canEdit: cp.canEdit ?? base.canEdit,
      canManageUsers: cp.canManageUsers ?? base.canManageUsers,
      canClockDriver: cp.canClockDriver ?? base.canClockDriver,
      canViewReports: cp.canViewReports ?? base.canViewReports,
      canViewDashboard: cp.canViewDashboard ?? base.canViewDashboard,
      canViewGarages: cp.canViewGarages ?? base.canViewGarages,
      canViewBikes: cp.canViewBikes ?? base.canViewBikes,
      canViewDrivers: cp.canViewDrivers ?? base.canViewDrivers,
      canViewSettings: cp.canViewSettings ?? base.canViewSettings,
    };
  }, [user]);

  const login = useCallback(
    async (username: string, password: string, rememberMe = false): Promise<string | null> => {
      const lockoutTime = getRemainingLockoutTime();
      if (lockoutTime !== null) {
        const minutes = Math.floor(lockoutTime / 60000);
        const seconds = Math.floor((lockoutTime % 60000) / 1000);
        return `Too many failed attempts. Please try again in ${minutes}m ${seconds}s.`;
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = (await response.json()) as { customToken?: string; user?: PublicUser; error?: string };

        if (!response.ok) {
          const result = recordFailedAttempt();
          if (result.locked) {
            const minutes = Math.floor((result.remainingTime || 0) / 60000);
            const seconds = Math.floor(((result.remainingTime || 0) % 60000) / 1000);
            return `Too many failed attempts. Account locked for ${minutes}m ${seconds}s.`;
          }
          return data.error || "Login failed.";
        }

        if (!data.customToken || !data.user) {
          return "Login failed.";
        }

        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithCustomToken(auth, data.customToken);
        setUser(data.user);
        recordSuccessfulLogin();
        return null;
      } catch {
        recordFailedAttempt();
        return "Unable to connect. Please try again.";
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("rider-garage-user");
    sessionStorage.removeItem("rider-garage-user");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, permissions, login, logout, isAuthenticated: !!user, isLoading }),
    [user, permissions, login, logout, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ROLE_PERMISSIONS };
