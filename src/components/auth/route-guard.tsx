"use client";

import type { ReactNode } from "react";
import { useAuth, type Permissions } from "@/contexts/auth-context";
import { AccessDenied } from "./access-denied";

type RouteGuardProps = {
  children: ReactNode;
  require: keyof Permissions;
};

export function RouteGuard({ children, require }: RouteGuardProps) {
  const { permissions } = useAuth();
  if (!permissions[require]) return <AccessDenied />;
  return <>{children}</>;
}
