export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { ReportsSectionOptimized } from "@/components/reports/reports-section-optimized";
import { RouteGuard } from "@/components/auth/route-guard";

export default function ReportsPage() {
  return (
    <AppShell title="Reports" description="Analytics, performance insights, and fleet summaries">
      <RouteGuard require="canViewReports">
        <ReportsSectionOptimized />
      </RouteGuard>
    </AppShell>
  );
}
