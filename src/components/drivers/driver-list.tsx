"use client";

import { useState } from "react";
import { Pencil, Trash2, Phone, Mail, Calendar, Bike as BikeIcon, User as UserIcon } from "lucide-react";
import type { Driver } from "@/types/driver";
import { BIKE_TYPES } from "@/types/bike";
import { useBikes } from "@/contexts/bikes-context";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";

type ViewMode = "list" | "grid";

type DriverListProps = {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  viewMode?: ViewMode;
};

export function DriverList({ drivers, onEdit, onDelete, readOnly = false, viewMode = "grid" }: DriverListProps) {
  const { bikes } = useBikes();
  const bikeMap = Object.fromEntries(bikes.map((b) => [b.id, b.plateNumber]));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isGrid = viewMode === "grid";

  function handleDeleteClick(id: string) {
    setDeletingId(id);
  }

  if (drivers.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <UserIcon className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-surface-900">No Drivers Yet</h3>
        <p className="mt-1 text-sm text-slate-500">Add your first driver using the button above.</p>
      </div>
    );
  }

  return (
    <div className={isGrid ? "grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3" : "space-y-3"}>
      {drivers.map((driver) => (
        <div
          key={driver.id}
          className={`${
            isGrid
              ? "group relative flex flex-col rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
              : "glass-panel flex flex-col gap-4 rounded-2xl p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
          }`}
        >
          {/* Top colored bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-400 to-brand-600" />

          {!driver.bikeId && (
            <div className="flex items-center justify-center gap-1.5 bg-amber-50 px-3 py-1 text-center text-[11px] font-semibold text-amber-700">
              No Bike Assigned
            </div>
          )}

          <div className="flex flex-1 flex-col gap-2.5 p-3">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[11px] font-bold shadow-sm">
                {driver.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-surface-900 truncate">
                  {driver.name}
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{driver.phone}</span>
                </span>
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 ring-1 ring-surface-200">
                <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="text-slate-600">{driver.joinDate}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ring-1 ${driver.bikeId ? "bg-surface-50 ring-surface-200" : "bg-amber-50 ring-amber-200"}`}>
                <BikeIcon className={`h-3 w-3 shrink-0 ${driver.bikeId ? "text-slate-400" : "text-amber-500"}`} />
                <span className={`truncate ${driver.bikeId ? "text-slate-600" : "text-amber-700 font-medium"}`}>
                  {driver.bikeId ? (bikeMap[driver.bikeId] ?? "Unknown") : "Waiting"}
                </span>
              </span>
              {driver.preferredBikeType && (
                <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-200">
                  {BIKE_TYPES.find((t) => t.id === driver.preferredBikeType)?.label ?? driver.preferredBikeType}
                </span>
              )}
            </div>

            {/* Email */}
            {driver.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">{driver.email}</span>
              </div>
            )}

            {/* Actions */}
            {!readOnly && (
              <div className="mt-auto flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onEdit(driver)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(driver.id)}
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
          title="Delete Driver"
          description="This action cannot be undone."
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
