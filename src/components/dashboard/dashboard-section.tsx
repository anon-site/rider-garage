"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Users, Bike, UserCheck, Clock, X, PackageOpen, Search, LayoutGrid, List, Store, MapPin, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useAttendance } from "@/contexts/attendance-context";
import { useDeliveryCategories, useGarages } from "@/contexts/control-panel-context";
import { useAuth } from "@/contexts/auth-context";
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
  const { user } = useAuth();
  const { garages } = useGarages();
  const { drivers: allDrivers } = useDrivers();
  const { bikes: allBikes } = useBikes();
  const { records } = useAttendance();
  const { deliveryCategories } = useDeliveryCategories();

  const managedGarage = useMemo(() => {
    if (user?.role === "garage" && user.garageId) {
      return garages.find((g) => g.id === user.garageId);
    }
    return null;
  }, [garages, user]);

  const [adminView, setAdminView] = useState<"all" | "garages">("all");
  const [selectedGarageId, setSelectedGarageId] = useState<string>("all");
  const [expandedGarageId, setExpandedGarageId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedGarageName = useMemo(() => {
    if (selectedGarageId === "all") return "All Garages";
    return garages.find((g) => g.id === selectedGarageId)?.name ?? "All Garages";
  }, [selectedGarageId, garages]);

  const drivers = useMemo(() => {
    if (user?.role === "garage" && user.garageId) {
      return allDrivers.filter((d) => d.garageId === user.garageId);
    }
    if (user?.role === "admin" && selectedGarageId !== "all") {
      return allDrivers.filter((d) => d.garageId === selectedGarageId);
    }
    return allDrivers;
  }, [allDrivers, user, selectedGarageId]);

  const bikes = useMemo(() => {
    if (user?.role === "garage" && user.garageId) {
      return allBikes.filter((b) => b.garageId === user.garageId);
    }
    if (user?.role === "admin" && selectedGarageId !== "all") {
      return allBikes.filter((b) => b.garageId === selectedGarageId);
    }
    return allBikes;
  }, [allBikes, user, selectedGarageId]);

  const bikeMap = useMemo(() => Object.fromEntries(bikes.map((b) => [b.id, b])), [bikes]);
  const garageMap = useMemo(() => Object.fromEntries(garages.map((g) => [g.id, g])), [garages]);

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
    return result.filter((d) => {
      const bike = d.bikeId ? bikeMap[d.bikeId] : null;
      return (
        d.name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        (d.appId?.toLowerCase().includes(q) ?? false) ||
        (bike?.plateNumber.toLowerCase().includes(q) ?? false)
      );
    });
  }, [drivers, filter, hasOpenExit, query, bikeMap]);

  const stats = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter((d) => hasOpenExit(d.id)).length,
    withBike: drivers.filter((d) => d.bikeId).length,
    waiting: drivers.filter((d) => !d.bikeId).length,
  }), [drivers, hasOpenExit]);

  return (
    <div className="space-y-6">
      {/* Admin's Garage Selector & View Toggle */}
      {user?.role === "admin" && (
        <div className="relative rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/50 to-white p-4 sm:p-5 shadow-sm z-30">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-2xl" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Admin Control Panel</span>
                <h2 className="text-base sm:text-lg font-extrabold text-surface-900 leading-tight">Garage Breakdown & Filtering</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Selector for الجميع (All) vs الكراجات (Garages) */}
              <div className="flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAdminView("all");
                    setSelectedGarageId("all");
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    adminView === "all" && selectedGarageId === "all"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Show All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminView("garages");
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    adminView === "garages"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Show Garages
                </button>
              </div>

              {/* Custom Dropdown to filter by specific garage */}
              {adminView === "all" && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center justify-between gap-2 min-w-[150px] rounded-xl border border-surface-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all cursor-pointer shadow-sm"
                  >
                    <span className="truncate">{selectedGarageName}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 z-50 origin-top-right rounded-xl border border-surface-150 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGarageId("all");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          selectedGarageId === "all"
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span>All Garages</span>
                        {selectedGarageId === "all" && <Check className="h-3.5 w-3.5 text-brand-600" />}
                      </button>
                      
                      <div className="h-px bg-slate-100 my-1" />

                      <div className="max-h-60 overflow-y-auto space-y-0.5">
                        {garages.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setSelectedGarageId(g.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                              selectedGarageId === g.id
                                ? "bg-brand-50 text-brand-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span className="truncate">{g.name}</span>
                            {selectedGarageId === g.id && <Check className="h-3.5 w-3.5 text-brand-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manager's Garage Info Bar */}
      {managedGarage && (
        <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-brand-100/30 p-4 sm:p-5 shadow-sm">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Assigned Garage</span>
                <h2 className="text-lg font-extrabold text-surface-900 leading-tight">{managedGarage.name}</h2>
              </div>
            </div>
            {managedGarage.location && (
              <div className="flex items-center gap-2 rounded-xl bg-white/85 px-3.5 py-2 ring-1 ring-brand-100/50 text-sm text-slate-600 sm:self-center">
                <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                <span className="font-medium truncate">{managedGarage.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === "admin" && adminView === "garages" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-surface-900">Garages Overview</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Detailed breakdown of active drivers and parked bikes across all garages
              </p>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200">
              {garages.length} Garages
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {garages.map((garage) => {
              const garageDrivers = allDrivers.filter((d) => d.garageId === garage.id);
              const garageBikes = allBikes.filter((b) => b.garageId === garage.id);
              const isExpanded = expandedGarageId === garage.id;
              
              const capacityPercentage = Math.min(
                100,
                Math.round((garageBikes.length / (garage.capacity || 1)) * 100)
              );

              return (
                <div
                  key={garage.id}
                  className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  <div
                    onClick={() => setExpandedGarageId(isExpanded ? null : garage.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-100">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-surface-900 truncate">
                          {garage.name}
                        </h4>
                        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{garage.location || "No location set"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Drivers</p>
                            <p className="text-sm font-bold text-surface-900 mt-0.5">{garageDrivers.length}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Bike className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Bikes</p>
                            <p className="text-sm font-bold text-surface-900 mt-0.5">
                              {garageBikes.length} <span className="text-[10px] font-normal text-slate-400">/ {garage.capacity || "—"}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {garage.capacity && (
                        <div className="hidden md:block w-28 shrink-0">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                            <span>Capacity</span>
                            <span className={capacityPercentage > 85 ? "text-amber-600" : "text-slate-500"}>
                              {capacityPercentage}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                capacityPercentage > 85 ? "bg-amber-500" : "bg-brand-500"
                              }`}
                              style={{ width: `${capacityPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors ml-auto sm:ml-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-surface-100 bg-slate-50/30 p-5 space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Garage Drivers Section */}
                        <div className="bg-white rounded-xl border border-surface-150 p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-surface-100">
                            <h5 className="text-xs font-bold text-surface-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-brand-500" />
                              Assigned Drivers ({garageDrivers.length})
                            </h5>
                          </div>
                          
                          {garageDrivers.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No drivers assigned to this garage</p>
                          ) : (
                            <div className="max-h-60 overflow-y-auto pr-1 space-y-2 divide-y divide-slate-100/50">
                              {garageDrivers.map((driver) => {
                                const driverBike = driver.bikeId ? allBikes.find((b) => b.id === driver.bikeId) : null;
                                const isOutside = hasOpenExit(driver.id);
                                return (
                                  <div
                                    key={driver.id}
                                    className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-3"
                                  >
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => setProfileDriver(driver)}
                                        className="font-bold text-surface-900 hover:text-brand-600 text-left hover:underline truncate block"
                                      >
                                        {driver.name}
                                      </button>
                                      <span className="text-[10px] text-slate-500 font-medium">App ID: {driver.appId} | {driver.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {driverBike ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-100">
                                          <Bike className="h-2.5 w-2.5" />
                                          {driverBike.plateNumber}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">
                                          No Bike
                                        </span>
                                      )}
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                          isOutside
                                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {isOutside ? "Outside" : "Inside"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Garage Bikes Section */}
                        <div className="bg-white rounded-xl border border-surface-150 p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-surface-100">
                            <h5 className="text-xs font-bold text-surface-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Bike className="h-3.5 w-3.5 text-brand-500" />
                              Parked Bikes ({garageBikes.length})
                            </h5>
                          </div>

                          {garageBikes.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No bikes parked in this garage</p>
                          ) : (
                            <div className="max-h-60 overflow-y-auto pr-1 space-y-2 divide-y divide-slate-100/50">
                              {garageBikes.map((bike) => {
                                const bikeDriver = bike.driverId ? allDrivers.find((d) => d.id === bike.driverId) : null;
                                
                                let statusCls = "bg-emerald-50 text-emerald-700 ring-emerald-100";
                                let statusLabel = "Good";
                                if (bike.status === "maintenance") {
                                  statusCls = "bg-amber-50 text-amber-700 ring-amber-100";
                                  statusLabel = "Maintenance";
                                } else if (bike.status === "defective") {
                                  statusCls = "bg-rose-50 text-rose-700 ring-rose-100";
                                  statusLabel = "Defect";
                                }

                                return (
                                  <div
                                    key={bike.id}
                                    className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-3"
                                  >
                                    <div>
                                      <span className="font-bold text-surface-900">{bike.plateNumber}</span>
                                      <span className="text-[10px] text-slate-500 ml-1.5 font-medium">
                                        {bike.bikeType === "electric_motorcycle" ? "Motorcycle" : "Bicycle"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {bikeDriver ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                                          <Users className="h-2.5 w-2.5 text-slate-400" />
                                          {bikeDriver.name}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium">Available</span>
                                      )}
                                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${statusCls}`}>
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
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
              placeholder="Search by name, phone, App ID or bike plate…"
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
                  garage={driver.garageId ? garageMap[driver.garageId] : undefined}
                  onProfile={() => setProfileDriver(driver)}
                  viewMode={viewMode}
                  deliveryCategories={deliveryCategories}
                  showGarage={user?.role === "admin"}
                />
              ))}
            </div>
          )}
        </>
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
