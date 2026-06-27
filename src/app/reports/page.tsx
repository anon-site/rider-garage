export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { ReportsSection } from "@/components/reports/reports-section";
import { RouteGuard } from "@/components/auth/route-guard";
import { AttendanceProvider } from "@/contexts/attendance-context";

export default function ReportsPage() {
  return (
    <AppShell title="Reports" description="Analytics, performance insights, and fleet summaries">
      <RouteGuard require="canViewReports">
        <AttendanceProvider>
          <ReportsSection />
        </AttendanceProvider>
      </RouteGuard>
    </AppShell>
  );
}
