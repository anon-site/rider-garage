"use client";

import { useMemo, useState } from "react";
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-surface-200 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 px-6 py-5">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/30">
                <Warehouse className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{garage.name}</h2>
                <p className="text-sm text-slate-400">{garage.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300 ring-1 ring-brand-500/30">
                <BikeIcon className="mr-1.5 inline h-3.5 w-3.5" />
                {garageBikes.length} bike{garageBikes.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
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
            <div className="space-y-4">
              {/* Search & View Mode Toggle */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by plate, color, type, status, driver..."
                    className="glass-panel w-full rounded-2xl border-0 py-2.5 pl-11 pr-10 text-sm text-surface-900 placeholder-slate-400 ring-1 ring-surface-200 outline-none transition-all focus:ring-2 focus:ring-brand-400 focus:shadow-md"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-100 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center rounded-xl bg-surface-100 p-1 ring-1 ring-surface-200">
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                    <Search className="h-3 w-3" />
                    {filteredBikes.length} result{filteredBikes.length !== 1 ? "s" : ""}
                  </span>
                  <button type="button" onClick={() => setQuery("")}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    Clear search
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
                />
              )}

              {/* List View (Table) */}
              {viewMode === "list" && (
                <div className="overflow-x-auto rounded-2xl border border-surface-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 bg-surface-50 text-left">
                        <th className="px-4 py-3 font-semibold text-slate-600">Plate Number</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Color</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Driver</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Registration</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {filteredBikes.map((bike) => (
                        <tr key={bike.id} className="transition-colors hover:bg-surface-50">
                          <td className="px-4 py-3 font-medium text-surface-900">{bike.plateNumber}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {BIKE_TYPES.find((t) => t.id === bike.bikeType)?.label ?? bike.bikeType}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{bike.color}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={bike.status} />
                            {bike.defectDescription && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {bike.defectDescription}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {bike.driverId ? (driverMap[bike.driverId] ?? "Unknown") : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{bike.registrationDate}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
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
