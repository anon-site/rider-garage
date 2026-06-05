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

  return (
    <div className={isGrid ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3" : "space-y-3"}>
      {garages.map((garage) => (
        <div
          key={garage.id}
          className={`glass-panel transition-shadow hover:shadow-md ${
            isGrid
              ? "flex flex-col gap-3 rounded-2xl p-4"
              : "flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
          }`}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 shrink-0 text-brand-600" />
              <h4 className="truncate text-base font-semibold text-surface-900">
                {garage.name}
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {garage.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Capacity: {garage.capacity}
              </span>
              <span className="inline-flex items-center gap-1.5 text-brand-600">
                <BikeIcon className="h-3.5 w-3.5" />
                {bikesCountMap[garage.id] ?? 0} Bikes
              </span>
              {garage.managerId && (
                <span className="inline-flex items-center gap-1.5 text-amber-600">
                  <User className="h-3.5 w-3.5" />
                  {managerNameMap[garage.managerId] ?? "Unknown"}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onView(garage)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:bg-brand-100"
              aria-label="Open garage"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
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
