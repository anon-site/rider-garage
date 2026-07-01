"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoginPage } from "./login-page";
import { AppLoading } from "@/components/layout/app-loading";
import { AuthenticatedProviders } from "./authenticated-providers";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AppLoading />;
  if (!isAuthenticated) return <LoginPage />;

  return <AuthenticatedProviders>{children}</AuthenticatedProviders>;
}
