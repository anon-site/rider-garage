"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Bike as BikeIcon, CheckCircle2, AlertTriangle,
  UserCheck, X, EyeOff, Warehouse, ChevronDown, MapPin, Check,
  Search,
} from "lucide-react";
import { useBikes } from "@/contexts/bikes-context";
import { useAuth } from "@/contexts/auth-context";
import { useGarages } from "@/contexts/control-panel-context";
import { useDrivers } from "@/contexts/drivers-context";
import { BikeList } from "./bike-list";
import { AddBikeModal } from "./add-bike-modal";
import { EditBikeModal } from "./edit-bike-modal";
import type { Bike } from "@/types/bike";

type BikeFilter = "all" | "good" | "defective" | "assigned";

function FilterCard({ icon: Icon, label, value, tone, active, onClick }: {
  icon: React.ElementType; label: string; value: number;
  tone?: "brand" | "emerald" | "amber" | "rose"; active: boolean; onClick: () => void;
}) {
  const toneClasses = {
    brand: "from-brand-500/15 to-brand-500/5 text-brand-600",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-600",
  };
  const activeRing = {
    brand: "ring-2 ring-brand-400 shadow-lg shadow-brand-200/40",
    emerald: "ring-2 ring-emerald-400 shadow-lg shadow-emerald-200/40",
    amber: "ring-2 ring-amber-400 shadow-lg shadow-amber-200/40",
    rose: "ring-2 ring-rose-400 shadow-lg shadow-rose-200/40",
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

export function BikesSection() {
  const { bikes, addBike, updateBike, changeBikeId, deleteBike } = useBikes();
  const { permissions } = useAuth();
  const { garages } = useGarages();
  const readOnly = !permissions.canEdit;
  const isAdmin = permissions.canManageUsers;

  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [filter, setFilter] = useState<BikeFilter>("all");
  const [query, setQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* bikes scoped to selected garage (or all) */
  const scopedBikes = useMemo(() => {
    if (!selectedGarageId) return bikes;
    if (selectedGarageId === "__none__") return bikes.filter((b) => !b.garageId);
    return bikes.filter((b) => b.garageId === selectedGarageId);
  }, [bikes, selectedGarageId]);

  const stats = useMemo(() => {
    const total = scopedBikes.length;
    const good = scopedBikes.filter((b) => b.status === "good").length;
    const defective = scopedBikes.filter((b) => b.status === "defective").length;
    const assigned = scopedBikes.filter((b) => b.driverId).length;
    return { total, good, defective, assigned };
  }, [scopedBikes]);

  const { drivers } = useDrivers();
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name.toLowerCase()]));

  const filterPassed = useMemo(() => {
    switch (filter) {
      case "good":       return scopedBikes.filter((b) => b.status === "good");
      case "defective":  return scopedBikes.filter((b) => b.status === "defective");
      case "assigned":   return scopedBikes.filter((b) => b.driverId);
      default:           return scopedBikes;
    }
  }, [scopedBikes, filter]);

  const filteredBikes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filterPassed;
    return filterPassed.filter((b) =>
      b.plateNumber.toLowerCase().includes(q) ||
      (b.color?.toLowerCase().includes(q) ?? false) ||
      b.status.toLowerCase().includes(q) ||
      b.bikeType.toLowerCase().includes(q) ||
      (b.driverId ? (driverMap[b.driverId] ?? "").includes(q) : false) ||
      (b.notes?.toLowerCase().includes(q) ?? false)
    );
  }, [filterPassed, query, driverMap]);

  const selectedGarage = garages.find((g) => g.id === selectedGarageId);
  const unassignedCount = bikes.filter((b) => !b.garageId).length;

  /* Label shown on the trigger button */
  const triggerLabel = !selectedGarageId
    ? "All Garages"
    : selectedGarageId === "__none__"
    ? "Unassigned"
    : (selectedGarage?.name ?? "Select Garage");

  const triggerCount = !selectedGarageId
    ? bikes.length
    : selectedGarageId === "__none__"
    ? unassignedCount
    : bikes.filter((b) => b.garageId === selectedGarageId).length;

  return (
    <div className="space-y-6">

      {/* ── Garage Dropdown (admin only) ────────────────────────── */}
      {isAdmin && (
        <div ref={dropdownRef} className="relative w-fit">

          {/* Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={`glass-panel flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm ring-1 transition-all hover:shadow-md ${
              dropdownOpen ? "ring-brand-400 shadow-md" : "ring-white/60"
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
              {!selectedGarageId ? (
                <Warehouse className="h-3.5 w-3.5 text-brand-600" />
              ) : selectedGarageId === "__none__" ? (
                <BikeIcon className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <Warehouse className="h-3.5 w-3.5 text-amber-500" />
              )}
            </span>
            <span className="text-surface-900">{triggerLabel}</span>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
              {triggerCount}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`} />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-xl shadow-surface-900/10 ring-1 ring-black/5">

              {/* Header */}
              <div className="border-b border-surface-100 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Select Garage</p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1.5">

                {/* All garages option */}
                <button
                  type="button"
                  onClick={() => { setSelectedGarageId(null); setFilter("all"); setDropdownOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-50 ${
                    !selectedGarageId ? "bg-brand-50" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <Warehouse className="h-4 w-4 text-brand-600" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-surface-900">All Garages</div>
                    <div className="text-[11px] text-slate-400">{bikes.length} bikes total</div>
                  </div>
                  {!selectedGarageId && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                </button>

                {/* Divider */}
                <div className="my-1.5 border-t border-surface-100" />

                {/* Individual garages */}
                {garages.map((garage) => {
                  const count = bikes.filter((b) => b.garageId === garage.id).length;
                  const isActive = selectedGarageId === garage.id;
                  return (
                    <button
                      key={garage.id}
                      type="button"
                      onClick={() => { setSelectedGarageId(garage.id); setFilter("all"); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-50 ${
                        isActive ? "bg-amber-50" : ""
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                        <Warehouse className="h-4 w-4 text-amber-600" />
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-semibold text-surface-900">{garage.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="truncate">{garage.location}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        {count}
                      </span>
                      {isActive && <Check className="h-4 w-4 shrink-0 text-amber-600" />}
                    </button>
                  );
                })}

                {/* Unassigned — only if applicable */}
                {unassignedCount > 0 && (
                  <>
                    <div className="my-1.5 border-t border-surface-100" />
                    <button
                      type="button"
                      onClick={() => { setSelectedGarageId("__none__"); setFilter("all"); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-50 ${
                        selectedGarageId === "__none__" ? "bg-surface-50" : ""
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-100">
                        <BikeIcon className="h-4 w-4 text-slate-500" />
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-semibold text-surface-900">Unassigned</div>
                        <div className="text-[11px] text-slate-400">No garage assigned</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        {unassignedCount}
                      </span>
                      {selectedGarageId === "__none__" && <Check className="h-4 w-4 shrink-0 text-slate-500" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Search Bar ───────────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by plate, color, type, driver…"
          className="glass-panel w-full rounded-2xl border-0 py-3 pl-11 pr-10 text-sm text-surface-900 placeholder-slate-400 ring-1 ring-white/60 outline-none transition-all focus:ring-2 focus:ring-brand-400 focus:shadow-md"
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

      {/* Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <FilterCard icon={BikeIcon} label="Total Bikes" value={stats.total} tone="brand" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterCard icon={CheckCircle2} label="Good Condition" value={stats.good} tone="emerald" active={filter === "good"} onClick={() => setFilter("good")} />
        <FilterCard icon={AlertTriangle} label="Need Repair" value={stats.defective} tone="rose" active={filter === "defective"} onClick={() => setFilter("defective")} />
        <FilterCard icon={UserCheck} label="Assigned" value={stats.assigned} tone="amber" active={filter === "assigned"} onClick={() => setFilter("assigned")} />
      </div>

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold text-surface-900">
            {selectedGarage ? (
              <>
                <Warehouse className="h-5 w-5 text-amber-500" />
                {selectedGarage.name}
              </>
            ) : selectedGarageId === "__none__" ? (
              <>
                <BikeIcon className="h-5 w-5 text-slate-400" />
                <span className="truncate">Unassigned Bikes</span>
              </>
            ) : (
              "Bike Fleet"
            )}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            {filter === "all" && (selectedGarage ? `Bikes in ${selectedGarage.name}` : "All bikes in the fleet")}
            {filter === "good" && "Bikes in good condition"}
            {filter === "defective" && "Bikes needing maintenance"}
            {filter === "assigned" && "Bikes assigned to drivers"}
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
          {query && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <Search className="h-3 w-3" />
              {filteredBikes.length} result{filteredBikes.length !== 1 ? "s" : ""}
            </span>
          )}
          {!query && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200">
              {filteredBikes.length} shown
            </span>
          )}
          {readOnly ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <EyeOff className="h-3.5 w-3.5" />
              View Only
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Bike
            </button>
          )}
        </div>
      </div>

      <BikeList bikes={filteredBikes} onEdit={setEditingBike} onDelete={deleteBike} readOnly={readOnly} />

      {!readOnly && showAdd && (
        <AddBikeModal
          onSubmit={addBike}
          onClose={() => setShowAdd(false)}
          existingPlateNumbers={bikes.map(b => b.plateNumber.toLowerCase())}
          existingIds={bikes.map(b => b.id)}
        />
      )}
      {!readOnly && editingBike && (
        <EditBikeModal
          bike={editingBike}
          onSave={updateBike}
          onChangeId={changeBikeId}
          onClose={() => setEditingBike(null)}
          existingPlateNumbers={bikes.map(b => b.plateNumber.toLowerCase())}
          existingIds={bikes.map(b => b.id)}
        />
      )}
    </div>
  );
}
