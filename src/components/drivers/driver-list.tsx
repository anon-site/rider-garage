"use client";

import { useState } from "react";
import { Pencil, Trash2, Phone, Mail, Calendar, Bike as BikeIcon, User as UserIcon } from "lucide-react";
import type { Driver } from "@/types/driver";
import { BIKE_TYPES } from "@/types/bike";
import { useBikes } from "@/contexts/bikes-context";

type DriverListProps = {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
};

export function DriverList({ drivers, onEdit, onDelete, readOnly = false }: DriverListProps) {
  const { bikes } = useBikes();
  const bikeMap = Object.fromEntries(bikes.map((b) => [b.id, b.plateNumber]));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function confirmDelete(id: string) {
    if (deletingId === id) {
      onDelete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {drivers.map((driver) => (
        <div
          key={driver.id}
          className="group relative flex flex-col rounded-2xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
        >
          {/* Top colored bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 to-brand-600" />

          {!driver.bikeId && (
            <div className="flex items-center justify-center gap-2 bg-amber-50 px-5 py-2 text-center text-sm font-semibold text-amber-700">
              No Bike
            </div>
          )}

          <div className="flex flex-1 flex-col gap-4 p-5">
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold shadow-sm">
                  {driver.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-surface-900 truncate">
                    {driver.name}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />
                    {driver.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-slate-600">{driver.joinDate}</span>
              </div>
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${driver.bikeId ? "bg-surface-50" : "bg-amber-50"}`}>
                <BikeIcon className={`h-3.5 w-3.5 shrink-0 ${driver.bikeId ? "text-slate-400" : "text-amber-500"}`} />
                <span className={`truncate text-sm ${driver.bikeId ? "text-slate-600" : "text-amber-700 font-medium"}`}>
                  {driver.bikeId ? (bikeMap[driver.bikeId] ?? "Unknown Bike") : "Waiting"}
                </span>
              </div>
            </div>

            {/* Email */}
            {driver.email && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{driver.email}</span>
              </div>
            )}

            {/* Preferred Bike Type */}
            {driver.preferredBikeType && (
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">
                  {BIKE_TYPES.find((t) => t.id === driver.preferredBikeType)?.label ?? driver.preferredBikeType}
                </span>
              </div>
            )}

            {/* Actions */}
            {!readOnly && (
              <>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onEdit(driver)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(driver.id)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                      deletingId === driver.id
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-surface-200 bg-white text-surface-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === driver.id ? "Confirm" : "Delete"}
                  </button>
                </div>
                {deletingId === driver.id && (
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
