"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { User, RoleId } from "@/types/user";
import type { CustomPermissions } from "@/types/user";

/* ── Permission matrix ─────────────────────────────────────────────────
  canEdit:        add / edit / delete records in Bikes & Drivers
  canManageUsers: access Control Panel (users/garages management)
  canViewAll:     access all pages
  canClockDriver: clock drivers in/out from Dashboard
──────────────────────────────────────────────────────────────────────── */
export type Permissions = {
  canEdit: boolean;
  canManageUsers: boolean;
  canViewAll: boolean;
  canClockDriver: boolean;
  canViewReports: boolean;
};

const ROLE_PERMISSIONS: Record<RoleId, Permissions> = {
  admin: {
    canEdit: true,
    canManageUsers: true,
    canViewAll: true,
    canClockDriver: true,
    canViewReports: true,
  },
  supervisor: {
    canEdit: false,
    canManageUsers: false,
    canViewAll: true,
    canClockDriver: false,
    canViewReports: true,
  },
  observer: {
    canEdit: false,
    canManageUsers: false,
    canViewAll: true,
    canClockDriver: false,
    canViewReports: false,
  },
  garage: {
    canEdit: false,
    canManageUsers: false,
    canViewAll: false,
    canClockDriver: true,
    canViewReports: false,
  },
};

/* ── Context value ─────────────────────────────────────────────────── */
export type AuthContextValue = {
  user: User | null;
  permissions: Permissions;
  /** Returns null on success, error string on failure */
  login: (username: string, password: string, allUsers: User[]) => string | null;
  logout: () => void;
  isAuthenticated: boolean;
};

const DEFAULT_PERMISSIONS: Permissions = {
  canEdit: false,
  canManageUsers: false,
  canViewAll: false,
  canClockDriver: false,
  canViewReports: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const permissions = useMemo<Permissions>(() => {
    if (!user) return DEFAULT_PERMISSIONS;
    const base = ROLE_PERMISSIONS[user.role];
    if (!user.customPermissions) return base;
    const cp = user.customPermissions as CustomPermissions;
    return {
      canEdit:        cp.canEdit        ?? base.canEdit,
      canManageUsers: cp.canManageUsers ?? base.canManageUsers,
      canViewAll:     cp.canViewAll     ?? base.canViewAll,
      canClockDriver: cp.canClockDriver ?? base.canClockDriver,
      canViewReports: cp.canViewReports ?? base.canViewReports,
    };
  }, [user]);

  const login = useCallback(
    (username: string, password: string, allUsers: User[]): string | null => {
      const found = allUsers.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!found) return "No account found with this username.";
      if (password !== found.password) return "Incorrect password.";
      setUser(found);
      return null;
    },
    []
  );

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, permissions, login, logout, isAuthenticated: !!user }),
    [user, permissions, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ──────────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ── Exported helpers ──────────────────────────────────────────────── */
export { ROLE_PERMISSIONS };
