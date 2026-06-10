"use client";

import { Phone, Calendar, Bike as BikeIcon, UserCircle, Star, Home, Package } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { Bike } from "@/types/bike";
import type { DeliveryCategory } from "@/types/delivery-category";
import { useAttendance } from "@/contexts/attendance-context";
import { useDeliveryCategories } from "@/contexts/control-panel-context";
import { DELIVERY_CATEGORIES } from "@/types/delivery-category";

type DriverCardProps = {
  driver: Driver;
  bike?: Bike;
  onProfile: () => void;
  viewMode?: "grid" | "list";
  deliveryCategories?: DeliveryCategory[];
};

export function DriverCard({ driver, bike, onProfile, viewMode = "grid", deliveryCategories = [] }: DriverCardProps) {
  const { getLatestRecord } = useAttendance();
  const latestRecord = getLatestRecord(driver.id);
  const isOutside = latestRecord && !latestRecord.clockOut;

  // Get delivery category info
  const deliveryCategory = deliveryCategories.find(cat => cat.id === driver.deliveryCategoryId) ||
    DELIVERY_CATEGORIES.find(cat => cat.id === driver.deliveryCategoryId);

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

  const deliveryCategoryBadge = deliveryCategory ? (
    <span 
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1"
      style={{ 
        backgroundColor: `${deliveryCategory.color}15`, 
        color: deliveryCategory.color, 
        borderColor: `${deliveryCategory.color}40` 
      }}
    >
      <Package className="h-3 w-3" />
      {deliveryCategory.name}
    </span>
  ) : null;

  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-brand-200">
        <div className={`h-1 w-1 self-stretch rounded-full ${isOutside ? "bg-emerald-500" : "bg-surface-300"}`} />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] sm:grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="text-sm font-bold text-surface-900 truncate">{driver.name}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{driver.phone}</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
            <span>{driver.joinDate ?? "—"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {bike ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 ring-1 ring-brand-200">
                <BikeIcon className="h-3 w-3 text-brand-500" />
                <span className="font-medium text-brand-700">{bike.plateNumber}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 ring-1 ring-amber-200">
                <BikeIcon className="h-3 w-3 text-amber-500" />
                <span className="font-medium text-amber-700">No Bike</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            {deliveryCategoryBadge}
            {latestRecord && latestRecord.rating > 0 && (
              <span className={`hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ring-1 ${latestRecord.rating >= 80 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                <Star className={`h-3 w-3 fill-current ${latestRecord.rating >= 80 ? "text-emerald-500" : "text-rose-500"}`} />
                {latestRecord.rating}
              </span>
            )}
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
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Phone className="h-3 w-3" />
              <span className="truncate">{driver.phone}</span>
            </span>
          </div>
          {statusBadge}
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {deliveryCategoryBadge}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 text-xs ring-1 ring-surface-200">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span className="text-slate-600">{driver.joinDate}</span>
          </span>
          {bike ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-xs ring-1 ring-brand-200">
              <BikeIcon className="h-3 w-3 text-brand-500" />
              <span className="font-medium text-brand-700">{bike.plateNumber}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs ring-1 ring-amber-200">
              <BikeIcon className="h-3 w-3 text-amber-500" />
              <span className="font-medium text-amber-700">No Bike</span>
            </span>
          )}
          {latestRecord && latestRecord.rating > 0 && (
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ring-1 ${latestRecord.rating >= 80 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
              <Star className={`h-3 w-3 fill-current ${latestRecord.rating >= 80 ? "text-emerald-500" : "text-rose-500"}`} />
              {latestRecord.rating}
            </span>
          )}
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
