export const dynamic = "force-static";
import { AppShell } from "@/components/layout/app-shell";
import { BikesSection } from "@/components/bikes/bikes-section";

export default function BikesPage() {
  return (
    <AppShell title="Bikes" description="Manage delivery bikes and maintenance">
      <BikesSection />
    </AppShell>
  );
}
