import { DashboardSkeleton } from "@/components/ui/section-skeleton";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardSkeleton />
    </div>
  );
}
