"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Garage } from "@/types/garage";
import { useUsers } from "@/contexts/control-panel-context";

type EditGarageModalProps = {
  garage: Garage | null;
  onSave: (id: string, changes: Partial<Omit<Garage, "id">>) => void;
  onClose: () => void;
};

export function EditGarageModal({ garage, onSave, onClose }: EditGarageModalProps) {
  const { users } = useUsers();
  const garageManagers = users.filter((u) => u.role === "garage");

  const [name, setName] = useState(garage?.name ?? "");
  const [location, setLocation] = useState(garage?.location ?? "");
  const [capacity, setCapacity] = useState(garage?.capacity ?? 1);
  const [managerId, setManagerId] = useState(garage?.managerId ?? "");

  useEffect(() => {
    if (garage) {
      setName(garage.name);
      setLocation(garage.location);
      setCapacity(garage.capacity);
      setManagerId(garage.managerId ?? "");
    }
  }, [garage]);

  if (!garage) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !garage) return;
    onSave(garage.id, { name, location, capacity, managerId: managerId || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-900">
            Edit Garage
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-100 hover:text-surface-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">
              Garage Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">
              Location
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">
              Capacity
            </label>
            <input
              type="number"
              required
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">
              Manager
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select a manager</option>
              {garageManagers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
