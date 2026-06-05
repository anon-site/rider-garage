"use client";

import { useState } from "react";
import { Pencil, Trash2, Bike as BikeIcon, Calendar, AlertCircle, FileText, User } from "lucide-react";
import type { Bike } from "@/types/bike";
import { BIKE_STATUSES, BIKE_TYPES } from "@/types/bike";
import { useDrivers } from "@/contexts/drivers-context";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";

type BikeListProps = {
  bikes: Bike[];
  onEdit: (bike: Bike) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  compact?: boolean;
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
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[status]}`}
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

export function BikeList({ bikes, onEdit, onDelete, readOnly = false, compact = false }: BikeListProps) {
  const { drivers } = useDrivers();
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDeleteClick(id: string) {
    setDeletingId(id);
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
    <div className={`grid gap-3 ${compact ? "grid-cols-[repeat(auto-fill,minmax(260px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(250px,1fr))]"}`}>
      {bikes.map((bike) => (
        <div
          key={bike.id}
          className="group relative flex flex-col rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
        >
          {/* Top colored bar */}
          <div className={`h-1 w-full ${StripeColor(bike.status)}`} />

          <div className={`flex flex-1 flex-col p-4 ${compact ? "gap-2.5" : "gap-3"}`}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm ${compact ? "h-10 w-10" : "h-9 w-9"}`}>
                  <BikeIcon className={compact ? "h-5 w-5" : "h-4 w-4"} />
                </div>
                <div className="min-w-0">
                  <h4 className={`font-bold text-surface-900 truncate ${compact ? "text-[13px]" : "text-sm"}`}>
                    {bike.plateNumber}
                  </h4>
                  <span className="text-xs text-slate-400">{bike.color}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={bike.status} />
                <span className="rounded-md bg-surface-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-surface-200">
                  {BIKE_TYPES.find((t) => t.id === bike.bikeType)?.label ?? bike.bikeType}
                </span>
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 ring-1 ring-surface-200">
                <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="text-slate-600">{bike.registrationDate}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 ring-1 ring-surface-200">
                <User className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate text-slate-600">
                  {bike.driverId ? (driverMap[bike.driverId] ?? "Unknown") : "No Driver"}
                </span>
              </span>
            </div>

            {/* Defect */}
            {bike.defectDescription && (
              <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-[13px] text-red-700">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{bike.defectDescription}</span>
              </div>
            )}

            {/* Notes */}
            {bike.notes && (
              <div className="flex items-start gap-1.5 text-[13px] text-slate-500">
                <FileText className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                <span className="line-clamp-2">{bike.notes}</span>
              </div>
            )}

            {/* Actions */}
            {!readOnly && (
              <div className="mt-auto flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onEdit(bike)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(bike.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs font-medium text-surface-700 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {deletingId && (
        <ConfirmDeleteModal
          title="Delete Bike"
          description="This action cannot be undone."
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
