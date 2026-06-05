export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { GarageView } from "@/components/garages/garage-view";

export default function GaragePage() {
  return (
    <AppShell title="My Garage" description="Garage dashboard — bikes and drivers">
      <GarageView />
    </AppShell>
  );
}
