"use client";

import { useState, useMemo, useCallback } from "react";
import { Users, Bike, UserCheck, Clock, X, PackageOpen, Search, LayoutGrid, List } from "lucide-react";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useAttendance } from "@/contexts/attendance-context";
import { DriverCard } from "./driver-card";
import { DriverProfileModal } from "./driver-profile-modal";
import type { Driver } from "@/types/driver";

type FilterType = "all" | "active" | "with-bike" | "waiting";

function FilterCard({ icon: Icon, label, value, tone, active, onClick }: { icon: React.ElementType; label: string; value: number; tone?: "brand" | "emerald" | "amber"; active: boolean; onClick: () => void; }) {
  const toneClasses = {
    brand: "from-brand-500/15 to-brand-500/5 text-brand-600",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
  };
  const activeRing = {
    brand: "ring-2 ring-brand-400 shadow-lg shadow-brand-200/40",
    emerald: "ring-2 ring-emerald-400 shadow-lg shadow-emerald-200/40",
    amber: "ring-2 ring-amber-400 shadow-lg shadow-amber-200/40",
  };
  const t = tone ?? "brand";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-panel relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 text-left ring-1 ring-white/60 transition-all hover:shadow-lg ${active ? activeRing[t] : ""}`}
    >
      <div className={`absolute -right-4 -top-4 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br ${toneClasses[t]} opacity-50 blur-xl`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold text-surface-900">{value}</p>
        </div>
        <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${toneClasses[t]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
        </div>
      </div>
      {active && (
        <div className="absolute bottom-1.5 sm:bottom-2 left-3 sm:left-5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtered</div>
      )}
    </button>
  );
}

export function DashboardSection() {
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { records } = useAttendance();
  const bikeMap = useMemo(() => Object.fromEntries(bikes.map((b) => [b.id, b])), [bikes]);

  const hasOpenExit = useCallback(
    (driverId: string) => records.some((r) => r.driverId === driverId && r.clockIn && !r.clockOut),
    [records]
  );

  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [profileDriver, setProfileDriver] = useState<Driver | null>(null);

  const filteredDrivers = useMemo(() => {
    let result = drivers;
    switch (filter) {
      case "active":   result = drivers.filter((d) => hasOpenExit(d.id)); break;
      case "with-bike": result = drivers.filter((d) => d.bikeId); break;
      case "waiting":  result = drivers.filter((d) => !d.bikeId); break;
    }
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      (d.appId?.toLowerCase().includes(q) ?? false)
    );
  }, [drivers, filter, hasOpenExit, query]);

  const stats = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter((d) => hasOpenExit(d.id)).length,
    withBike: drivers.filter((d) => d.bikeId).length,
    waiting: drivers.filter((d) => !d.bikeId).length,
  }), [drivers, hasOpenExit]);

  return (
    <div className="space-y-6">
      {/* Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <FilterCard icon={Users} label="Total Drivers" value={stats.total} tone="brand" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterCard icon={UserCheck} label="Active Outside" value={stats.active} tone="emerald" active={filter === "active"} onClick={() => setFilter("active")} />
        <FilterCard icon={Bike} label="With Bike" value={stats.withBike} tone="brand" active={filter === "with-bike"} onClick={() => setFilter("with-bike")} />
        <FilterCard icon={Clock} label="Waiting" value={stats.waiting} tone="amber" active={filter === "waiting"} onClick={() => setFilter("waiting")} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or App ID…"
          className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-9 pr-9 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-surface-900">Driver Overview</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            {filter === "all" && "All drivers in the fleet"}
            {filter === "active" && "Drivers currently on shift"}
            {filter === "with-bike" && "Drivers with assigned bikes"}
            {filter === "waiting" && "Drivers waiting for bike assignment"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200 transition-colors hover:bg-surface-200"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200">
            {filteredDrivers.length} shown
          </span>
          {/* View toggle */}
          <div className="flex rounded-lg border border-surface-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                viewMode === "grid" ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                viewMode === "list" ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-16 text-center">
          <PackageOpen className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {filter === "all" ? "No drivers yet" : "No drivers match this filter"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {filter !== "all" ? "Try selecting a different category above" : "Add drivers from the Drivers page"}
          </p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3" : "flex flex-col gap-2"}>
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              bike={driver.bikeId ? bikeMap[driver.bikeId] : undefined}
              onProfile={() => setProfileDriver(driver)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {profileDriver && (
        <DriverProfileModal
          driver={profileDriver}
          bikeName={profileDriver.bikeId ? bikeMap[profileDriver.bikeId]?.plateNumber : undefined}
          onClose={() => setProfileDriver(null)}
        />
      )}
    </div>
  );
}
