"use client";

import { useState } from "react";
import { Pencil, Trash2, MapPin, Store, Users, User, Bike as BikeIcon, ExternalLink } from "lucide-react";
import type { Garage } from "@/types/garage";
import { useUsers } from "@/contexts/control-panel-context";
import { useBikes } from "@/contexts/bikes-context";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";

type ViewMode = "list" | "grid";

type GarageListProps = {
  garages: Garage[];
  onEdit: (garage: Garage) => void;
  onDelete: (id: string) => void;
  onView: (garage: Garage) => void;
  viewMode?: ViewMode;
};

export function GarageList({ garages, onEdit, onDelete, onView, viewMode = "grid" }: GarageListProps) {
  const { users } = useUsers();
  const { bikes } = useBikes();
  const managerNameMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const bikesCountMap = Object.fromEntries(
    garages.map((g) => [g.id, bikes.filter((b) => b.garageId === g.id).length])
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isGrid = viewMode === "grid";

  function handleDeleteClick(id: string) {
    setDeletingId(id);
  }

  if (garages.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <Store className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-surface-900">
          No Garages Yet
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add your first garage using the form above.
        </p>
      </div>
    );
  }

  // LIST VIEW
  if (!isGrid) {
    return (
      <div className="space-y-2">
        {garages.map((garage) => (
          <div
            key={garage.id}
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-surface-200 transition-all hover:shadow-md hover:ring-brand-200"
          >
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm">
              <Store className="h-5 w-5" />
            </div>

            {/* Main Info */}
            <div className="flex min-w-0 flex-1 items-center gap-6">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-surface-900">{garage.name}</h4>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span className="truncate">{garage.location}</span>
                </div>
              </div>

              {/* Chips */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 ring-1 ring-surface-200">
                  <Users className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-600">{garage.capacity}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 ring-1 ring-brand-200">
                  <BikeIcon className="h-3 w-3 text-brand-500" />
                  <span className="font-medium text-brand-700">{bikesCountMap[garage.id] ?? 0}</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ring-1 ${garage.managerId ? "bg-amber-50 ring-amber-200" : "bg-surface-50 ring-surface-200"}`}>
                  <User className={`h-3 w-3 ${garage.managerId ? "text-amber-500" : "text-slate-400"}`} />
                  <span className={`truncate ${garage.managerId ? "text-amber-700 font-medium" : "text-slate-400"}`}>
                    {garage.managerId ? (managerNameMap[garage.managerId] ?? "Unknown") : "No Manager"}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => onView(garage)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition-all hover:bg-brand-100"
                aria-label="Open garage"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </button>
              <button
                type="button"
                onClick={() => onEdit(garage)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-600"
                aria-label="Edit garage"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(garage.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete garage"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {deletingId && (
          <ConfirmDeleteModal
            title="Delete Garage"
            description="This action cannot be undone."
            onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
            onCancel={() => setDeletingId(null)}
          />
        )}
      </div>
    );
  }

  // GRID VIEW
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
      {garages.map((garage) => (
        <div
          key={garage.id}
          className="glass-panel flex flex-col gap-3 rounded-2xl p-4 transition-shadow hover:shadow-md"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Title */}
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 shrink-0 text-brand-600" />
              <h4 className="truncate text-base font-semibold text-surface-900">
                {garage.name}
              </h4>
            </div>
            {/* Address */}
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {garage.location}
            </span>
            {/* Capacity & Bikes */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Capacity: {garage.capacity}
              </span>
              <span className="inline-flex items-center gap-1.5 text-brand-600">
                <BikeIcon className="h-3.5 w-3.5" />
                {bikesCountMap[garage.id] ?? 0} Bikes
              </span>
            </div>
            {/* Manager */}
            <span className={`inline-flex items-center gap-1.5 text-sm ${garage.managerId ? "text-amber-600" : "text-slate-400"}`}>
              <User className="h-3.5 w-3.5 shrink-0" />
              {garage.managerId ? (managerNameMap[garage.managerId] ?? "Unknown") : "No Manager"}
            </span>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onView(garage)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:bg-brand-100"
              aria-label="Open garage"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(garage)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-700 shadow-sm transition-colors hover:bg-surface-100"
                aria-label="Edit garage"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(garage.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-700 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Delete garage"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {deletingId && (
        <ConfirmDeleteModal
          title="Delete Garage"
          description="This action cannot be undone."
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
