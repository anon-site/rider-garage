"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AccessDenied } from "./access-denied";

type RouteGuardProps = {
  children: ReactNode;
  require: "canManageUsers" | "canEdit" | "canViewAll" | "canClockDriver";
};

export function RouteGuard({ children, require }: RouteGuardProps) {
  const { permissions } = useAuth();
  if (!permissions[require]) return <AccessDenied />;
  return <>{children}</>;
}
