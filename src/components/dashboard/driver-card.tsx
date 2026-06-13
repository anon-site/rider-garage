"use client";

import { Phone, Calendar, Bike as BikeIcon, UserCircle, Star, Home, Package, Store } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { Bike } from "@/types/bike";
import type { DeliveryCategory } from "@/types/delivery-category";
import type { Garage } from "@/types/garage";
import { useAttendance } from "@/contexts/attendance-context";
import { DELIVERY_CATEGORIES } from "@/types/delivery-category";

type DriverCardProps = {
  driver: Driver;
  bike?: Bike;
  garage?: Garage;
  onProfile: () => void;
  viewMode?: "grid" | "list";
  deliveryCategories?: DeliveryCategory[];
  showGarage?: boolean;
};

export function DriverCard({ driver, bike, garage, onProfile, viewMode = "grid", deliveryCategories = [], showGarage = false }: DriverCardProps) {
  const { getLatestRecord } = useAttendance();
  const latestRecord = getLatestRecord(driver.id);
  const isOutside = latestRecord && !latestRecord.clockOut;

  // Get delivery category info
  const driverCategories = driver.deliveryCategoryIds?.map(id => 
    deliveryCategories.find(cat => cat.id === id) || DELIVERY_CATEGORIES.find(cat => cat.id === id)
  ).filter(Boolean) || [];

  const initials = driver.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusBadge = isOutside ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
      </span>
      Outside
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
      <Home className="h-3 w-3" />
      Inside
    </span>
  );

  const deliveryCategoryBadges = driverCategories.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {driverCategories.map((category) => (
        <span 
          key={category!.id}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1"
          style={{ 
            backgroundColor: `${category!.color}15`, 
            color: category!.color, 
            borderColor: `${category!.color}40` 
          }}
        >
          <Package className="h-3 w-3" />
          {category!.name}
        </span>
      ))}
    </div>
  ) : null;

  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-brand-200">
        <div className={`h-1 w-1 self-stretch rounded-full ${isOutside ? "bg-emerald-500" : "bg-surface-300"}`} />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] items-center gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="text-sm font-bold text-surface-900 truncate">{driver.name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">{driver.joinDate ?? "—"}</span>
              </p>
              {showGarage && garage && (
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 ring-1 ring-brand-100">
                  <Store className="h-2.5 w-2.5" />
                  <span className="truncate">{garage.name}</span>
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="text-slate-600">{driver.phone}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {bike ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 ring-1 ring-brand-200">
                <BikeIcon className="h-3.5 w-3.5 text-brand-500" />
                <span className="font-medium text-brand-700">{bike.plateNumber}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 ring-1 ring-amber-200">
                <BikeIcon className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium text-amber-700">No Bike</span>
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {deliveryCategoryBadges}
            {latestRecord && latestRecord.rating > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ${latestRecord.rating >= 80 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                <Star className={`h-3.5 w-3.5 fill-current ${latestRecord.rating >= 80 ? "text-emerald-500" : "text-rose-500"}`} />
                {latestRecord.rating}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            {statusBadge}
            <button
              type="button"
              onClick={onProfile}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 shadow-sm transition-all hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200"
            >
              <UserCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-border-gradient group relative flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
      {/* Top bar */}
      <div className={`h-1.5 w-full ${isOutside ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-surface-300 to-surface-400"}`} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-surface-900 truncate">{driver.name}</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="truncate">{driver.joinDate}</span>
              </span>
              {showGarage && garage && (
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 ring-1 ring-brand-100">
                  <Store className="h-2.5 w-2.5" />
                  <span className="truncate">{garage.name}</span>
                </span>
              )}
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Info chips - organized in two rows */}
        <div className="space-y-2">
          {/* Primary info row */}
          <div className="flex flex-wrap items-center gap-2">
            {bike ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                <BikeIcon className="h-3.5 w-3.5" />
                {bike.plateNumber}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                <BikeIcon className="h-3.5 w-3.5" />
                No Bike
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-50 px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-surface-200">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {driver.phone}
            </span>
          </div>
          
          {/* Secondary info row */}
          <div className="flex flex-wrap items-center gap-2">
            {deliveryCategoryBadges}
            {latestRecord && latestRecord.rating > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ${latestRecord.rating >= 80 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                <Star className={`h-3.5 w-3.5 fill-current ${latestRecord.rating >= 80 ? "text-emerald-500" : "text-rose-500"}`} />
                {latestRecord.rating}
              </span>
            )}
          </div>
        </div>

        {/* Profile button */}
        <div className="mt-auto flex justify-end pt-1">
          <button
            type="button"
            onClick={onProfile}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 shadow-sm transition-all hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200"
          >
            <UserCircle className="h-3.5 w-3.5" />
            Open Profile
          </button>
        </div>
      </div>
    </div>
  );
}
