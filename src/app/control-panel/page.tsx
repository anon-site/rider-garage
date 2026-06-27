export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs } from "@/components/ui/tabs";
import { UsersSection } from "@/components/users/users-section";
import { CpDashboard } from "@/components/control-panel/cp-dashboard";
import { RouteGuard } from "@/components/auth/route-guard";
import { AttendanceProvider } from "@/contexts/attendance-context";

export default function ControlPanelPage() {
  return (
    <AppShell title="Control Panel" description="Operations monitoring and controls">
      <RouteGuard require="canManageUsers">
        <Tabs
          tabs={[
            { id: "dashboard", label: "Dashboard", content: (
              <AttendanceProvider>
                <CpDashboard />
              </AttendanceProvider>
            ) },
            { id: "users",     label: "Users",     content: <UsersSection /> },
          ]}
        />
      </RouteGuard>
    </AppShell>
  );
}
