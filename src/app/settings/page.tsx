export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsClientPage } from "@/components/settings/settings-client-page";
import { RouteGuard } from "@/components/auth/route-guard";
import { AttendanceProvider } from "@/contexts/attendance-context";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" description="System configuration and preferences">
      <RouteGuard require="canViewSettings">
        <AttendanceProvider>
          <SettingsClientPage />
        </AttendanceProvider>
      </RouteGuard>
    </AppShell>
  );
}
