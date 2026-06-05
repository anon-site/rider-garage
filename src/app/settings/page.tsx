export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsClientPage } from "@/components/settings/settings-client-page";
import { RouteGuard } from "@/components/auth/route-guard";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" description="System configuration and preferences">
      <RouteGuard require="canManageUsers">
        <SettingsClientPage />
      </RouteGuard>
    </AppShell>
  );
}
