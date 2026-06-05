"use client";

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-surface-200/60 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-surface-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-lg bg-surface-200" />
          <div className="h-3 w-1/2 rounded-lg bg-surface-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded-lg bg-surface-100" />
        <div className="h-3 w-4/5 rounded-lg bg-surface-100" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-surface-200/60 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded-lg bg-surface-200" />
          <div className="h-7 w-12 rounded-lg bg-surface-200" />
        </div>
        <div className="h-11 w-11 rounded-xl bg-surface-200" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 rounded-xl border border-surface-200/60 bg-white/80 px-4 py-3">
      <div className="h-9 w-9 rounded-full bg-surface-200" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-1/3 rounded-lg bg-surface-200" />
        <div className="h-3 w-1/4 rounded-lg bg-surface-100" />
      </div>
      <div className="h-8 w-16 rounded-lg bg-surface-100" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-surface-200" />
        <div className="h-3 w-56 animate-pulse rounded-lg bg-surface-100" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
