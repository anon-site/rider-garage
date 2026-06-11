export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { GaragesSection } from "@/components/garages/garages-section";
import { RouteGuard } from "@/components/auth/route-guard";

export default function GaragesPage() {
  return (
    <AppShell title="Garages" description="Manage garage locations and assignments">
      <RouteGuard require="canViewGarages">
        <GaragesSection />
      </RouteGuard>
    </AppShell>
  );
}
