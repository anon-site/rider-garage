"use client";

import { useState } from "react";
import { Pencil, Trash2, MapPin, Store, Users, User } from "lucide-react";
import type { Garage } from "@/types/garage";
import { useUsers } from "@/contexts/control-panel-context";

type ViewMode = "list" | "grid";

type GarageListProps = {
  garages: Garage[];
  onEdit: (garage: Garage) => void;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
};

export function GarageList({ garages, onEdit, onDelete, viewMode = "list" }: GarageListProps) {
  const { users } = useUsers();
  const managerNameMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
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
    <div className={isGrid ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
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
              onClick={() => onEdit(garage)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-700 shadow-sm transition-colors hover:bg-surface-100"
              aria-label="Edit garage"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => confirmDelete(garage.id)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium shadow-sm transition-colors ${
                deletingId === garage.id
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-surface-200 bg-white text-surface-700 hover:bg-red-50 hover:text-red-600"
              }`}
              aria-label={
                deletingId === garage.id ? "Confirm delete" : "Delete garage"
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {deletingId === garage.id && (
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
