"use client";

import type { ReactNode } from "react";
import { ControlPanelProvider } from "@/contexts/control-panel-context";
import { BikesProvider } from "@/contexts/bikes-context";
import { DriversProvider } from "@/contexts/drivers-context";
import { LiveShiftsProvider } from "@/contexts/live-shifts-context";

/** Data providers that require Firebase Auth — only mount after login. */
export function AuthenticatedProviders({ children }: { children: ReactNode }) {
  return (
    <ControlPanelProvider>
      <BikesProvider>
        <DriversProvider>
          <LiveShiftsProvider>{children}</LiveShiftsProvider>
        </DriversProvider>
      </BikesProvider>
    </ControlPanelProvider>
  );
}
