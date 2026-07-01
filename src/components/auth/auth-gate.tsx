"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoginPage } from "./login-page";
import { AppLoading } from "@/components/layout/app-loading";
import { AuthenticatedProviders } from "./authenticated-providers";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isFirebaseConfigured, firebaseConfigError } = useAuth();

  if (isLoading) return <AppLoading />;
  if (!isFirebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Configuration Required</p>
          <h1 className="mt-3 text-2xl font-bold text-surface-900">Firebase settings are missing</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The app was deployed without the required Firebase environment variables, so authentication and data loading
            were intentionally stopped to prevent a client-side crash.
          </p>
          {firebaseConfigError && (
            <div className="mt-5 rounded-2xl border border-surface-200 bg-surface-50 p-4 text-sm text-slate-700">
              {firebaseConfigError}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <LoginPage />;

  return <AuthenticatedProviders>{children}</AuthenticatedProviders>;
}
