"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useUsers } from "@/contexts/control-panel-context";
import { LoginPage } from "./login-page";
import { AppLoading } from "@/components/layout/app-loading";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated } = useAuth();
  const { loading } = useUsers();

  if (!hydrated || loading) return <AppLoading />;
  if (!isAuthenticated) return <LoginPage />;
  return <>{children}</>;
}
