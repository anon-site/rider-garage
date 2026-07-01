"use client";

import { useEffect, useMemo } from "react";
import { MapPin, Warehouse } from "lucide-react";
import { useGarages, useUsers } from "@/contexts/control-panel-context";
import { buildGarageAssignmentOptions } from "@/lib/garage-assignment";
import { cn } from "@/lib/utils";

type GarageAssignmentSelectProps = {
  value: string;
  onChange: (garageId: string) => void;
  /** When editing a manager, keep their current garage selectable. */
  currentManagerUserId?: string;
  error?: string;
};

export function GarageAssignmentSelect({
  value,
  onChange,
  currentManagerUserId,
  error,
}: GarageAssignmentSelectProps) {
  const { garages } = useGarages();
  const { users } = useUsers();

  const options = useMemo(
    () => buildGarageAssignmentOptions(garages, users, currentManagerUserId),
    [garages, users, currentManagerUserId]
  );

  const available = options.filter((option) => option.available);
  const occupied = options.filter((option) => !option.available);

  useEffect(() => {
    if (!value) return;
    const selected = options.find((option) => option.id === value);
    if (selected && !selected.available) {
      onChange("");
    }
  }, [value, options, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-surface-900">Assigned Garage</label>
        <span className="text-xs font-medium text-slate-500">
          {available.length} available
        </span>
      </div>

      <div className="relative">
        <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={available.length === 0}
          className={cn(
            "w-full appearance-none rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm text-surface-900 outline-none focus:ring-2",
            error
              ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
              : "border-surface-200 focus:border-brand-400 focus:ring-brand-100",
            available.length === 0 && "cursor-not-allowed bg-surface-50 text-slate-400"
          )}
        >
          <option value="">
            {available.length === 0 ? "No garages available" : "Select an available garage"}
          </option>

          {available.length > 0 && (
            <optgroup label="Available garages">
              {available.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name} — {garage.location}
                </option>
              ))}
            </optgroup>
          )}

          {occupied.length > 0 && (
            <optgroup label="Already has a manager">
              {occupied.map((garage) => (
                <option key={garage.id} value={garage.id} disabled>
                  {garage.name} — Managed by {garage.managerName ?? "another manager"}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {available.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          All garages already have a manager. Free a garage first or create a new one.
        </p>
      ) : (
        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Garages with an assigned manager cannot be selected again.
        </p>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
