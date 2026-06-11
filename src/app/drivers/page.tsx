export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { DriversSection } from "@/components/drivers/drivers-section";
import { RouteGuard } from "@/components/auth/route-guard";

export default function DriversPage() {
  return (
    <AppShell title="Drivers" description="Rider profiles, shifts, and assignments">
      <RouteGuard require="canViewDrivers">
        <DriversSection />
      </RouteGuard>
    </AppShell>
  );
}
