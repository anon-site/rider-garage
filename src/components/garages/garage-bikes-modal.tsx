"use client";

import { useMemo, useState, useEffect } from "react";
import { X, Bike as BikeIcon, Warehouse, AlertCircle, LayoutGrid, List, Search } from "lucide-react";
import type { Garage } from "@/types/garage";
import { useBikes } from "@/contexts/bikes-context";
import { useDrivers } from "@/contexts/drivers-context";
import { BIKE_STATUSES, BIKE_TYPES } from "@/types/bike";
import type { Bike } from "@/types/bike";
import { BikeList } from "@/components/bikes/bike-list";

type GarageBikesModalProps = {
  garage: Garage;
  onClose: () => void;
};

type ViewMode = "grid" | "list";

function StatusBadge({ status }: { status: Bike["status"] }) {
  const label = BIKE_STATUSES.find((s) => s.id === status)?.label ?? status;
  const styles: Record<Bike["status"], string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 ring-amber-200",
    defective: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${styles[status]}`}>
      {label}
    </span>
  );
}

export function GarageBikesModal({ garage, onClose }: GarageBikesModalProps) {
  const { bikes } = useBikes();
  const { drivers } = useDrivers();
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("garage-bikes-view-mode");
    return (saved === "list" || saved === "grid") ? saved : "grid";
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem("garage-bikes-view-mode", viewMode);
  }, [viewMode]);

  const garageBikes = useMemo(
    () => bikes.filter((b) => b.garageId === garage.id),
    [bikes, garage.id]
  );

  const filteredBikes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return garageBikes;
    return garageBikes.filter((b) => {
      const driverName = b.driverId ? (driverMap[b.driverId] ?? "").toLowerCase() : "";
      const typeName = (BIKE_TYPES.find((t) => t.id === b.bikeType)?.label ?? "").toLowerCase();
      const statusName = (BIKE_STATUSES.find((s) => s.id === b.status)?.label ?? "").toLowerCase();
      return (
        b.plateNumber.toLowerCase().includes(q) ||
        b.color.toLowerCase().includes(q) ||
        typeName.includes(q) ||
        statusName.includes(q) ||
        driverName.includes(q) ||
        (b.notes ?? "").toLowerCase().includes(q) ||
        (b.defectDescription ?? "").toLowerCase().includes(q)
      );
    });
  }, [garageBikes, driverMap, query]);

  // Prevent Escape key from closing modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-[95vw] max-w-6xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-surface-200 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 px-4 py-3 sm:px-5 sm:py-4">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 ring-1 ring-amber-400/30">
                <Warehouse className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">{garage.name}</h2>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">{garage.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-brand-300 ring-1 ring-brand-500/30">
                <BikeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {garageBikes.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 sm:p-5">
          {garageBikes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
                <BikeIcon className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-surface-900">
                  No Bikes in This Garage
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  There are no bikes assigned to this garage yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Search & View Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search bikes..."
                    className="glass-panel w-full rounded-xl sm:rounded-2xl border-0 py-2 sm:py-2.5 pl-10 sm:pl-11 pr-9 sm:pr-10 text-sm text-surface-900 placeholder-slate-400 ring-1 ring-surface-200 outline-none transition-all focus:ring-2 focus:ring-brand-400 focus:shadow-md"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-100 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center rounded-xl bg-surface-100 p-1 ring-1 ring-surface-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 transition-all ${
                      viewMode === "grid"
                        ? "bg-white text-brand-600 shadow-sm ring-1 ring-surface-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2 transition-all ${
                      viewMode === "list"
                        ? "bg-white text-brand-600 shadow-sm ring-1 ring-surface-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Results badge */}
              {query && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                    <Search className="h-3 w-3" />
                    {filteredBikes.length} result{filteredBikes.length !== 1 ? "s" : ""}
                  </span>
                  <button type="button" onClick={() => setQuery("")}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    Clear
                  </button>
                </div>
              )}

              {/* Grid View (Cards) */}
              {viewMode === "grid" && (
                <BikeList
                  bikes={filteredBikes}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  readOnly
                  compact
                />
              )}

              {/* List View (Table) */}
              {viewMode === "list" && (
                <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-surface-200 -mx-3 sm:mx-0 px-3 sm:px-0">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-surface-200 bg-surface-50 text-left">
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Plate</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Type</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Color</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Status</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Driver</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Reg. Date</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-600 text-xs sm:text-sm">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {filteredBikes.map((bike) => (
                        <tr key={bike.id} className="transition-colors hover:bg-surface-50">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-surface-900 text-xs sm:text-sm">{bike.plateNumber}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs sm:text-sm">
                            {BIKE_TYPES.find((t) => t.id === bike.bikeType)?.label ?? bike.bikeType}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs sm:text-sm">{bike.color}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <StatusBadge status={bike.status} />
                            {bike.defectDescription && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {bike.defectDescription}
                              </p>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs sm:text-sm">
                            {bike.driverId ? (driverMap[bike.driverId] ?? "Unknown") : "—"}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs sm:text-sm">{bike.registrationDate}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-500 max-w-[150px] sm:max-w-[200px] truncate text-xs sm:text-sm">
                            {bike.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
