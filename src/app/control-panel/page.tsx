export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs } from "@/components/ui/tabs";
import { GaragesSection } from "@/components/garages/garages-section";
import { UsersSection } from "@/components/users/users-section";
import { CpDashboard } from "@/components/control-panel/cp-dashboard";
import { RouteGuard } from "@/components/auth/route-guard";

export default function ControlPanelPage() {
  return (
    <AppShell title="Control Panel" description="Operations monitoring and controls">
      <RouteGuard require="canManageUsers">
        <Tabs
          tabs={[
            { id: "dashboard", label: "Dashboard", content: <CpDashboard /> },
            { id: "users",     label: "Users",     content: <UsersSection /> },
            { id: "garages",   label: "Garages",   content: <GaragesSection /> },
          ]}
        />
      </RouteGuard>
    </AppShell>
  );
}
