"use client";

import { useState, memo } from "react";
import { Pencil, Trash2, Phone, Calendar, Bike as BikeIcon, User as UserIcon, Package, Store } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { DeliveryCategory } from "@/types/delivery-category";
import type { Garage } from "@/types/garage";
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
  deliveryCategories?: DeliveryCategory[];
  garageMap?: Record<string, Garage>;
  showGarage?: boolean;
};

const DriverListComponent = function DriverList({ drivers, onEdit, onDelete, readOnly = false, viewMode = "grid", deliveryCategories = [], garageMap = {}, showGarage = false }: DriverListProps) {
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

  // LIST VIEW
  if (!isGrid) {
    return (
      <div className="space-y-2">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-surface-200 transition-all hover:shadow-md hover:ring-brand-200"
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[11px] font-bold shadow-sm">
              {driver.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            {/* Main Info */}
            <div className="flex min-w-0 flex-1 items-center gap-6">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-surface-900">{driver.name}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {driver.joinDate}
                  </span>
                  {showGarage && driver.garageId && garageMap[driver.garageId] && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 ring-1 ring-brand-100">
                      <Store className="h-2.5 w-2.5" />
                      <span className="truncate">{garageMap[driver.garageId].name}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Info chips */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 ring-1 ring-surface-200">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="text-slate-600">{driver.phone}</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ring-1 ${driver.bikeId ? "bg-surface-50 ring-surface-200" : "bg-amber-50 ring-amber-200"}`}>
                  <BikeIcon className={`h-3 w-3 shrink-0 ${driver.bikeId ? "text-slate-400" : "text-amber-500"}`} />
                  <span className={`truncate ${driver.bikeId ? "text-slate-600" : "text-amber-700 font-medium"}`}>
                    {driver.bikeId ? (bikeMap[driver.bikeId] ?? "Unknown") : "No Bike"}
                  </span>
                </span>
                {driver.preferredBikeType && (
                  <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-200">
                    {BIKE_TYPES.find((t) => t.id === driver.preferredBikeType)?.label ?? driver.preferredBikeType}
                  </span>
                )}
                {driver.deliveryCategoryIds && driver.deliveryCategoryIds.length > 0 && deliveryCategories.length > 0 && (() => {
                  const categories = driver.deliveryCategoryIds.map(id => deliveryCategories.find(c => c.id === id)).filter(Boolean);
                  return categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {categories.map((category) => (
                        <span 
                          key={category!.id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ring-1"
                          style={{ 
                            backgroundColor: `${category!.color}20`, 
                            color: category!.color,
                            borderColor: category!.color 
                          }}
                        >
                          <Package className="h-3 w-3" />
                          {category!.name}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(driver)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Edit driver"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(driver.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete driver"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
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

  // GRID VIEW
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
      {drivers.map((driver) => (
        <div
          key={driver.id}
          className="animate-border-gradient group relative flex flex-col rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
        >
          {/* Top colored bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-400 to-brand-600" />

          {!driver.bikeId && (
            <div className="flex items-center justify-center gap-1.5 bg-amber-50 px-3 py-1.5 text-center text-xs font-semibold text-amber-700">
              No Bike Assigned
            </div>
          )}

          <div className="flex flex-1 flex-col gap-3 p-4">
            {/* Header row */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold shadow-sm">
                {driver.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-bold text-surface-900 truncate">
                  {driver.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="truncate">{driver.joinDate}</span>
                  </span>
                  {showGarage && driver.garageId && garageMap[driver.garageId] && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 ring-1 ring-brand-100">
                      <Store className="h-2.5 w-2.5" />
                      <span className="truncate">{garageMap[driver.garageId].name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2.5 py-1 ring-1 ring-surface-200">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="text-slate-600">{driver.phone}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ring-1 ${driver.bikeId ? "bg-surface-50 ring-surface-200" : "bg-amber-50 ring-amber-200"}`}>
                <BikeIcon className={`h-3.5 w-3.5 shrink-0 ${driver.bikeId ? "text-slate-400" : "text-amber-500"}`} />
                <span className={`truncate ${driver.bikeId ? "text-slate-600" : "text-amber-700 font-medium"}`}>
                  {driver.bikeId ? (bikeMap[driver.bikeId] ?? "Unknown") : "Waiting"}
                </span>
              </span>
              {driver.preferredBikeType && (
                <span className="inline-flex items-center rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                  {BIKE_TYPES.find((t) => t.id === driver.preferredBikeType)?.label ?? driver.preferredBikeType}
                </span>
              )}
              {driver.deliveryCategoryIds && driver.deliveryCategoryIds.length > 0 && deliveryCategories.length > 0 && (() => {
                const categories = driver.deliveryCategoryIds.map(id => deliveryCategories.find(c => c.id === id)).filter(Boolean);
                return categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {categories.map((category) => (
                      <span 
                        key={category!.id}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1"
                        style={{ 
                          backgroundColor: `${category!.color}20`, 
                          color: category!.color,
                          borderColor: category!.color 
                        }}
                      >
                        <Package className="h-3 w-3" />
                        {category!.name}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="mt-auto flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onEdit(driver)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-2 text-[13px] font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(driver.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-2 text-[13px] font-medium text-surface-700 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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

export const DriverList = memo(DriverListComponent);
