export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { BikesSection } from "@/components/bikes/bikes-section";
import { RouteGuard } from "@/components/auth/route-guard";

export default function BikesPage() {
  return (
    <AppShell title="Bikes" description="Manage delivery bikes and maintenance">
      <RouteGuard require="canViewBikes">
        <BikesSection />
      </RouteGuard>
    </AppShell>
  );
}
