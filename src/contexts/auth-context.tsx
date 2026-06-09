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
import type { User, RoleId } from "@/types/user";
import type { CustomPermissions } from "@/types/user";
import { verifyPassword, isHashedPassword } from "@/lib/crypto";
import { recordFailedAttempt, recordSuccessfulLogin, getRemainingLockoutTime } from "@/lib/rate-limiter";

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
  login: (username: string, password: string, allUsers: User[], rememberMe?: boolean) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount (check localStorage first, then sessionStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem("rider-garage-user") || sessionStorage.getItem("rider-garage-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("rider-garage-user");
        sessionStorage.removeItem("rider-garage-user");
      }
    }
    setIsLoading(false);
  }, []);

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
    async (username: string, password: string, allUsers: User[], rememberMe = false): Promise<string | null> => {
      // Check rate limiting first
      const lockoutTime = getRemainingLockoutTime();
      if (lockoutTime !== null) {
        const minutes = Math.floor(lockoutTime / 60000);
        const seconds = Math.floor((lockoutTime % 60000) / 1000);
        return `Too many failed attempts. Please try again in ${minutes}m ${seconds}s.`;
      }

      const found = allUsers.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!found) {
        recordFailedAttempt();
        return "No account found with this username.";
      }
      
      // Check password - support both hashed and plain text for migration
      let passwordValid = false;
      if (isHashedPassword(found.password)) {
        passwordValid = await verifyPassword(password, found.password);
      } else {
        // Legacy plain text comparison
        passwordValid = password === found.password;
      }
      
      if (!passwordValid) {
        const result = recordFailedAttempt();
        if (result.locked) {
          const minutes = Math.floor((result.remainingTime || 0) / 60000);
          const seconds = Math.floor(((result.remainingTime || 0) % 60000) / 1000);
          return `Too many failed attempts. Account locked for ${minutes}m ${seconds}s.`;
        }
        return "Incorrect password.";
      }
      
      // Successful login - clear rate limiting
      recordSuccessfulLogin();
      
      setUser(found);
      // Save to localStorage if rememberMe, otherwise sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("rider-garage-user", JSON.stringify(found));
      return null;
    },
    []
  );

  const logout = useCallback(() => {
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

/* ── Hook ──────────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ── Exported helpers ──────────────────────────────────────────────── */
export { ROLE_PERMISSIONS };
