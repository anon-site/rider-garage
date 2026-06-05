"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Garage } from "@/types/garage";
import { useUsers } from "@/contexts/control-panel-context";

type EditGarageModalProps = {
  garage: Garage | null;
  onSave: (id: string, changes: Partial<Omit<Garage, "id">>) => void;
  onChangeId?: (oldId: string, newId: string) => Promise<void>;
  onClose: () => void;
  existingNames?: string[];
  existingIds?: string[];
};

export function EditGarageModal({ garage, onSave, onChangeId, onClose, existingNames = [], existingIds = [] }: EditGarageModalProps) {
  const { users } = useUsers();
  const garageManagers = users.filter((u) => u.role === "garage");

  const [customId, setCustomId] = useState("");
  const [name, setName] = useState(garage?.name ?? "");
  const [location, setLocation] = useState(garage?.location ?? "");
  const [capacity, setCapacity] = useState(garage?.capacity ?? 1);
  const [managerId, setManagerId] = useState(garage?.managerId ?? "");

  const otherNames = garage ? existingNames.filter(n => n !== garage.name.toLowerCase()) : existingNames;
  const otherIds = garage ? existingIds.filter(id => id !== garage.id) : existingIds;
  const isDuplicateName = name.trim() !== "" && otherNames.includes(name.trim().toLowerCase());
  const isDuplicateId = customId.trim() !== "" && otherIds.includes(customId.trim());

  useEffect(() => {
    if (garage) {
      setCustomId(garage.id);
      setName(garage.name);
      setLocation(garage.location);
      setCapacity(garage.capacity);
      setManagerId(garage.managerId ?? "");
    }
  }, [garage]);

  if (!garage) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !garage) return;
    if (isDuplicateName || isDuplicateId) return;

    // Handle ID change if different
    if (customId.trim() && customId.trim() !== garage.id && onChangeId) {
      await onChangeId(garage.id, customId.trim());
    }

    // Always use original garage.id - ID change is handled separately by onChangeId
    // Use null to explicitly clear managerId in Firebase, undefined won't update
    onSave(garage.id, { name, location, capacity, managerId: managerId || null });
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
          {/* ID + Name */}
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Garage ID</label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value.replace(/\s+/g, ""))}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:ring-2 ${
                  isDuplicateId
                    ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                    : customId.trim() && !isDuplicateId && customId.trim() !== garage?.id
                    ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                    : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                }`}
              />
              {isDuplicateId && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                  ID exists
                </p>
              )}
              {customId.trim() && !isDuplicateId && customId.trim() !== garage?.id && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ID will change
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Garage Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:ring-2 ${
                  isDuplicateName
                    ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                    : name.trim() && !isDuplicateName
                    ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                    : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                }`}
              />
              {isDuplicateName && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Name exists
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Capacity + Manager */}
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Capacity</label>
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
              <label className="text-sm font-medium text-surface-900">Manager</label>
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
              disabled={isDuplicateName || isDuplicateId}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                isDuplicateName || isDuplicateId
                  ? "bg-surface-200 text-slate-400 cursor-not-allowed"
                  : "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-300"
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
