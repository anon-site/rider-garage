export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { RouteGuard } from "@/components/auth/route-guard";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" description="Fleet overview and daily insights">
      <RouteGuard require="canViewDashboard">
        <DashboardSection />
      </RouteGuard>
    </AppShell>
  );
}
