export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" description="Fleet overview and daily insights">
      <DashboardSection />
    </AppShell>
  );
}
