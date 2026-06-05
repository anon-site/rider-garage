"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Users, Bike, Clock, X, EyeOff,
  Warehouse, LayoutGrid, List, ChevronDown, MapPin, Check, Search,
} from "lucide-react";
import { useDrivers } from "@/contexts/drivers-context";
import { useAuth } from "@/contexts/auth-context";
import { useGarages } from "@/contexts/control-panel-context";
import { DriverList } from "./driver-list";
import { AddDriverModal } from "./add-driver-modal";
import { EditDriverModal } from "./edit-driver-modal";
import type { Driver } from "@/types/driver";

type DriverFilter = "all" | "with-bike" | "waiting";
type ViewMode = "list" | "grid";

function FilterCard({ icon: Icon, label, value, tone, active, onClick }: { icon: React.ElementType; label: React.ReactNode; value: number; tone?: "brand" | "emerald" | "amber"; active: boolean; onClick: () => void; }) {
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
      className={`glass-panel relative overflow-hidden rounded-lg sm:rounded-xl p-2.5 sm:p-5 text-left ring-1 ring-white/60 transition-all hover:shadow-lg ${active ? activeRing[t] : ""}`}
    >
      {/* Background blur - hidden on mobile */}
      <div className={`absolute -right-4 -top-4 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br ${toneClasses[t]} opacity-40 sm:opacity-50 blur-xl hidden sm:block`} />
      
      {/* Mobile: Vertical layout */}
      <div className="sm:hidden relative flex flex-col items-center text-center gap-1">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${toneClasses[t]}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-lg font-bold text-surface-900 leading-tight">{value}</p>
        </div>
      </div>
      
      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex relative items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${toneClasses[t]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      
      {active && (
        <div className="absolute bottom-1 sm:bottom-2 left-2 sm:left-5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtered</div>
      )}
    </button>
  );
}

export function DriversSection() {
  const { drivers, addDriver, updateDriver, changeDriverId, deleteDriver } = useDrivers();
  const { permissions } = useAuth();
  const { garages } = useGarages();
  const readOnly = !permissions.canEdit;
  const isAdmin = permissions.canManageUsers;

  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [filter, setFilter] = useState<DriverFilter>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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

  /* drivers scoped to selected garage */
  const scopedDrivers = useMemo(() => {
    if (!selectedGarageId) return drivers;
    if (selectedGarageId === "__none__") return drivers.filter((d) => !d.garageId);
    return drivers.filter((d) => d.garageId === selectedGarageId);
  }, [drivers, selectedGarageId]);

  const stats = useMemo(() => {
    const total = scopedDrivers.length;
    const withBike = scopedDrivers.filter((d) => d.bikeId).length;
    const waiting = scopedDrivers.filter((d) => !d.bikeId).length;
    return { total, withBike, waiting };
  }, [scopedDrivers]);

  const filterPassed = useMemo(() => {
    switch (filter) {
      case "with-bike": return scopedDrivers.filter((d) => d.bikeId);
      case "waiting":   return scopedDrivers.filter((d) => !d.bikeId);
      default:          return scopedDrivers;
    }
  }, [scopedDrivers, filter]);

  const filteredDrivers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filterPassed;
    return filterPassed.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      (d.email?.toLowerCase().includes(q) ?? false) ||
      (d.preferredBikeType?.toLowerCase().includes(q) ?? false)
    );
  }, [filterPassed, query]);

  const selectedGarage = garages.find((g) => g.id === selectedGarageId);
  const unassignedCount = drivers.filter((d) => !d.garageId).length;

  const triggerLabel = !selectedGarageId
    ? "All Garages"
    : selectedGarageId === "__none__"
    ? "Unassigned"
    : (selectedGarage?.name ?? "Select Garage");

  const triggerCount = !selectedGarageId
    ? drivers.length
    : selectedGarageId === "__none__"
    ? unassignedCount
    : drivers.filter((d) => d.garageId === selectedGarageId).length;

  return (
    <div className="space-y-6">

      {/* ── Garage Dropdown (admin only) - Desktop ────────────────────────── */}
      {isAdmin && (
        <div ref={dropdownRef} className="relative w-fit hidden sm:block">

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
                <LayoutGrid className="h-3.5 w-3.5 text-brand-600" />
              ) : selectedGarageId === "__none__" ? (
                <Users className="h-3.5 w-3.5 text-slate-500" />
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

              <div className="border-b border-surface-100 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Select Garage</p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1.5">

                {/* All */}
                <button
                  type="button"
                  onClick={() => { setSelectedGarageId(null); setFilter("all"); setDropdownOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-50 ${!selectedGarageId ? "bg-brand-50" : ""}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <LayoutGrid className="h-4 w-4 text-brand-600" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-surface-900">All Garages</div>
                    <div className="text-[11px] text-slate-400">{drivers.length} drivers total</div>
                  </div>
                  {!selectedGarageId && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                </button>

                <div className="my-1.5 border-t border-surface-100" />

                {/* Per-garage */}
                {garages.map((garage) => {
                  const count = drivers.filter((d) => d.garageId === garage.id).length;
                  const isActive = selectedGarageId === garage.id;
                  return (
                    <button
                      key={garage.id}
                      type="button"
                      onClick={() => { setSelectedGarageId(garage.id); setFilter("all"); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-50 ${isActive ? "bg-amber-50" : ""}`}
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

                {/* Unassigned */}
                {unassignedCount > 0 && (
                  <>
                    <div className="my-1.5 border-t border-surface-100" />
                    <button
                      type="button"
                      onClick={() => { setSelectedGarageId("__none__"); setFilter("all"); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-50 ${selectedGarageId === "__none__" ? "bg-surface-50" : ""}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-100">
                        <Users className="h-4 w-4 text-slate-500" />
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
          placeholder="Search by name, phone, email…"
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

      {/* Filter Cards - Mobile: shorter labels via CSS truncation */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <FilterCard icon={Users} label={<><span className="hidden sm:inline">Total</span><span className="sm:hidden">All</span></>} value={stats.total} tone="brand" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterCard icon={Bike} label={<><span className="hidden sm:inline">With Bike</span><span className="sm:hidden">Bike</span></>} value={stats.withBike} tone="emerald" active={filter === "with-bike"} onClick={() => setFilter("with-bike")} />
        <FilterCard icon={Clock} label={<><span className="hidden sm:inline">Waiting</span><span className="sm:hidden">Wait</span></>} value={stats.waiting} tone="amber" active={filter === "waiting"} onClick={() => setFilter("waiting")} />
      </div>

      {/* Mobile: Garage selector - only show on mobile */}
      {isAdmin && (
        <div className="sm:hidden space-y-2">
          {/* Mobile dropdown trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="glass-panel flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-white/60"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                {!selectedGarageId ? (
                  <LayoutGrid className="h-3.5 w-3.5 text-brand-600" />
                ) : selectedGarageId === "__none__" ? (
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <Warehouse className="h-3.5 w-3.5 text-amber-500" />
                )}
              </span>
              <span className="text-surface-900">{triggerLabel}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                {triggerCount}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {/* Mobile dropdown panel */}
          {dropdownOpen && (
            <div className="overflow-hidden rounded-xl border border-surface-200/80 bg-white shadow-lg ring-1 ring-black/5">
              <div className="max-h-64 overflow-y-auto">
                {/* All */}
                <button
                  type="button"
                  onClick={() => { setSelectedGarageId(null); setFilter("all"); setDropdownOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-50 ${!selectedGarageId ? "bg-brand-50" : ""}`}
                >
                  <LayoutGrid className="h-4 w-4 text-brand-600" />
                  <span className="flex-1 text-left font-medium text-surface-900">All Garages</span>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">{drivers.length}</span>
                </button>
                {/* Garages */}
                {garages.map((garage) => {
                  const count = drivers.filter((d) => d.garageId === garage.id).length;
                  const isActive = selectedGarageId === garage.id;
                  return (
                    <button
                      key={garage.id}
                      type="button"
                      onClick={() => { setSelectedGarageId(garage.id); setFilter("all"); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-50 ${isActive ? "bg-amber-50" : ""}`}
                    >
                      <Warehouse className="h-4 w-4 text-amber-600" />
                      <span className="flex-1 text-left font-medium text-surface-900">{garage.name}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{count}</span>
                    </button>
                  );
                })}
                {/* Unassigned */}
                {unassignedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSelectedGarageId("__none__"); setFilter("all"); setDropdownOpen(false); }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-50 ${selectedGarageId === "__none__" ? "bg-surface-50" : ""}`}
                  >
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="flex-1 text-left font-medium text-surface-900">Unassigned</span>
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{unassignedCount}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
                <Users className="h-5 w-5 text-slate-400" />
                <span className="truncate">Unassigned Drivers</span>
              </>
            ) : (
              "Driver Roster"
            )}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            {filter === "all" && (selectedGarage ? `Drivers in ${selectedGarage.name}` : "All drivers in the fleet")}
            {filter === "with-bike" && "Drivers with assigned bikes"}
            {filter === "waiting" && "Drivers waiting for bike assignment"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 sm:px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200 transition-colors hover:bg-surface-200"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          {query && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 sm:px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <Search className="h-3 w-3" />
              <span className="hidden sm:inline">{filteredDrivers.length} result{filteredDrivers.length !== 1 ? "s" : ""}</span>
              <span className="sm:hidden">{filteredDrivers.length}</span>
            </span>
          )}
          {!query && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-2 sm:px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200">
              <span className="hidden sm:inline">{filteredDrivers.length} shown</span>
              <span className="sm:hidden">{filteredDrivers.length}</span>
            </span>
          )}
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-surface-100 p-1 ring-1 ring-surface-200">
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
          </div>
          {readOnly ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <EyeOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Only</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-brand-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Driver</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      <DriverList drivers={filteredDrivers} onEdit={setEditingDriver} onDelete={deleteDriver} readOnly={readOnly} viewMode={viewMode} />

      {!readOnly && showAdd && (
        <AddDriverModal onSubmit={addDriver} onClose={() => setShowAdd(false)} existingIds={drivers.map(d => d.id)} />
      )}
      {!readOnly && editingDriver && (
        <EditDriverModal
          driver={editingDriver}
          onSave={updateDriver}
          onChangeId={changeDriverId}
          onClose={() => setEditingDriver(null)}
          existingIds={drivers.map(d => d.id)}
        />
      )}
    </div>
  );
}
