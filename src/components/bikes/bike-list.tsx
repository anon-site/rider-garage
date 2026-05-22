"use client";

import { useState } from "react";
import { Pencil, Trash2, Bike as BikeIcon, Calendar, AlertCircle, FileText, User } from "lucide-react";
import type { Bike } from "@/types/bike";
import { BIKE_STATUSES, BIKE_TYPES } from "@/types/bike";
import { useDrivers } from "@/contexts/drivers-context";

type ViewMode = "list" | "grid";

type BikeListProps = {
  bikes: Bike[];
  onEdit: (bike: Bike) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  viewMode?: ViewMode;
};

function StatusBadge({ status }: { status: Bike["status"] }) {
  const label = BIKE_STATUSES.find((s) => s.id === status)?.label ?? status;
  const styles: Record<Bike["status"], string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 ring-amber-200",
    defective: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function StripeColor(status: Bike["status"]) {
  const map: Record<Bike["status"], string> = {
    good: "bg-emerald-500",
    maintenance: "bg-amber-500",
    defective: "bg-red-500",
  };
  return map[status];
}

export function BikeList({ bikes, onEdit, onDelete, readOnly = false, viewMode = "list" }: BikeListProps) {
  const { drivers } = useDrivers();
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isGrid = viewMode === "grid";

  function confirmDelete(id: string) {
    if (deletingId === id) {
      onDelete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  if (bikes.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <BikeIcon className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-surface-900">No Bikes Yet</h3>
        <p className="mt-1 text-sm text-slate-500">Add your first bike using the button above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {bikes.map((bike) => (
        <div
          key={bike.id}
          className="group relative flex flex-col rounded-xl sm:rounded-2xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
        >
          {/* Top colored bar */}
          <div className={`h-1.5 w-full ${StripeColor(bike.status)}`} />

          <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm">
                  <BikeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-surface-900 truncate">
                    {bike.plateNumber}
                  </h4>
                  <span className="text-[11px] sm:text-xs text-slate-400">{bike.color}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={bike.status} />
                <span className="rounded-md bg-surface-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-slate-500 ring-1 ring-surface-200">
                  {BIKE_TYPES.find((t) => t.id === bike.bikeType)?.label ?? bike.bikeType}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-surface-50 px-2.5 sm:px-3 py-2">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-slate-600">{bike.registrationDate}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-surface-50 px-2.5 sm:px-3 py-2">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-slate-600">
                  {bike.driverId ? (driverMap[bike.driverId] ?? "Unknown") : "No Driver"}
                </span>
              </div>
            </div>

            {/* Defect */}
            {bike.defectDescription && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{bike.defectDescription}</span>
              </div>
            )}

            {/* Notes */}
            {bike.notes && (
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="line-clamp-2">{bike.notes}</span>
              </div>
            )}

            {/* Actions */}
            {!readOnly && (
              <>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onEdit(bike)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-surface-200 bg-white px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                  >
                    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(bike.id)}
                    className={`inline-flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium shadow-sm transition-colors ${
                      deletingId === bike.id
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-surface-200 bg-white text-surface-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {deletingId === bike.id ? "Confirm" : "Delete"}
                  </button>
                </div>
                {deletingId === bike.id && (
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="text-center text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
