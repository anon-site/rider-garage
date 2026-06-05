"use client";

import { Phone, Calendar, Bike as BikeIcon, UserCircle } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { Bike } from "@/types/bike";
import { useAttendance } from "@/contexts/attendance-context";

type DriverCardProps = {
  driver: Driver;
  bike?: Bike;
  onProfile: () => void;
};

export function DriverCard({ driver, bike, onProfile }: DriverCardProps) {
  const { getLatestRecord } = useAttendance();
  const latestRecord = getLatestRecord(driver.id);
  const isOutside = latestRecord && !latestRecord.clockOut;

  return (
    <div className={`glass-panel relative flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-shadow hover:shadow-md ${isOutside ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-slate-300"}`}>
      {/* Status badge — top right */}
      <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
        {isOutside ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Outside</span>
            <span className="sm:hidden">Out</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
            <span className="inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-400" />
            <span className="hidden sm:inline">Inside</span>
            <span className="sm:hidden">In</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 pr-16 sm:pr-20">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm sm:text-base font-bold">
          {driver.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-semibold text-surface-900 truncate">{driver.name}</h4>
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="truncate">{driver.phone}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">Joined </span>
          {driver.joinDate}
        </span>
        {bike && (
          <span className="inline-flex items-center gap-1">
            <BikeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {bike.plateNumber}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onProfile}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-surface-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Profile
      </button>
    </div>
  );
}
