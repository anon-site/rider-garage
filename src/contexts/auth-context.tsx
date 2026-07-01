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
import { setLastActiveTime } from "@/lib/notification-last-active";

/* ── Permission matrix ─────────────────────────────────────────────────
  canEdit:        add / edit / delete records in Bikes & Drivers
  canManageUsers: access Control Panel (users/garages management)
  canViewAll:     access all pages
  canClockDriver: clock drivers in/out from Dashboard
──────────────────────────────────────────────────────────────────────── */
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
    canViewBikes: true,
    canViewDrivers: true,
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
  canClockDriver: false,
  canViewReports: false,
  canViewDashboard: false,
  canViewGarages: false,
  canViewBikes: false,
  canViewDrivers: false,
  canViewSettings: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount (check localStorage first, then sessionStorage)
  useEffect(() => {
    const raw = localStorage.getItem("rider-garage-user") || sessionStorage.getItem("rider-garage-user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const savedAt = parsed.__savedAt as number | undefined;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (savedAt && Date.now() - savedAt > maxAge) {
          // Session expired
          localStorage.removeItem("rider-garage-user");
          sessionStorage.removeItem("rider-garage-user");
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { __savedAt: _savedAt, ...userData } = parsed;
          setUser(userData as User);
        }
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
      canEdit:          cp.canEdit          ?? base.canEdit,
      canManageUsers:   cp.canManageUsers   ?? base.canManageUsers,
      canClockDriver:   cp.canClockDriver   ?? base.canClockDriver,
      canViewReports:   cp.canViewReports   ?? base.canViewReports,
      canViewDashboard: cp.canViewDashboard ?? base.canViewDashboard,
      canViewGarages:   cp.canViewGarages   ?? base.canViewGarages,
      canViewBikes:     cp.canViewBikes     ?? base.canViewBikes,
      canViewDrivers:   cp.canViewDrivers   ?? base.canViewDrivers,
      canViewSettings:  cp.canViewSettings  ?? base.canViewSettings,
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
      // Remove password before persisting & add timestamp for expiry
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...safeUser } = found;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("rider-garage-user", JSON.stringify({ ...safeUser, __savedAt: Date.now() }));
      return null;
    },
    []
  );

  const logout = useCallback(() => {
    setUser((current) => {
      if (current?.id) {
        setLastActiveTime(current.id);
      }
      return null;
    });
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
