"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Save, UserCog } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { BikeTypeId, Bike } from "@/types/bike";
import { BIKE_TYPES } from "@/types/bike";
import { useBikes } from "@/contexts/bikes-context";
import { useGarages } from "@/contexts/control-panel-context";

type EditDriverModalProps = {
  driver: Driver | null;
  onSave: (id: string, changes: Partial<Omit<Driver, "id">>) => void;
  onChangeId?: (oldId: string, newId: string) => Promise<void>;
  onClose: () => void;
  existingIds?: string[];
};

export function EditDriverModal({ driver, onSave, onChangeId, onClose, existingIds = [] }: EditDriverModalProps) {
  const { bikes } = useBikes();
  const { garages } = useGarages();

  // Show unassigned bikes plus the driver's current bike
  const availableBikes = useMemo(() => {
    const unassigned = bikes.filter(b => !b.driverId);
    if (driver?.bikeId) {
      const currentBike = bikes.find(b => b.id === driver.bikeId);
      if (currentBike) {
        return [...unassigned, currentBike];
      }
    }
    return unassigned;
  }, [bikes, driver?.bikeId]);
  const [customId, setCustomId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [email, setEmail] = useState("");
  const [garageId, setGarageId] = useState("");
  const [preferredBikeType, setPreferredBikeType] = useState<BikeTypeId>("electric_motorcycle");
  const [bikeId, setBikeId] = useState("");

  useEffect(() => {
    if (driver) {
      setCustomId(driver.id);
      setName(driver.name);
      setPhone(driver.phone);
      setJoinDate(driver.joinDate);
      setEmail(driver.email ?? "");
      setGarageId(driver.garageId ?? "");
      setPreferredBikeType(driver.preferredBikeType ?? "electric_motorcycle");
      setBikeId(driver.bikeId ?? "");
    }
  }, [driver]);

  const otherIds = driver ? existingIds.filter(id => id !== driver.id) : existingIds;
  const isDuplicateId = customId.trim() !== "" && otherIds.includes(customId.trim());
  const hasIdChanged = driver && customId.trim() !== driver.id;

  if (!driver) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !joinDate || !driver) return;
    if (isDuplicateId) return;

    // Handle ID change first if needed
    if (hasIdChanged && onChangeId && customId.trim()) {
      try {
        await onChangeId(driver.id, customId.trim());
      } catch {
        return; // Abort if ID change failed
      }
    }

    const changes: Partial<Omit<Driver, "id">> = {
      name,
      phone,
      joinDate,
      preferredBikeType,
    };
    changes.email = email.trim() || undefined;
    changes.garageId = garageId || undefined;
    changes.bikeId = bikeId || undefined;
    onSave(hasIdChanged ? customId.trim() : driver.id, changes);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 p-5 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md">
                <UserCog className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Edit Driver</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">
              Driver ID
            </label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="e.g. DRV-001"
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:ring-2 ${
                isDuplicateId
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                  : hasIdChanged && !isDuplicateId
                  ? "border-amber-400 focus:border-amber-400 focus:ring-amber-100"
                  : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
              }`}
            />
            {isDuplicateId && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                This ID already exists. Please choose a different one.
              </p>
            )}
            {hasIdChanged && !isDuplicateId && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                ID will be changed on save
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Join Date</label>
              <input
                type="date"
                required
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Email <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Garage</label>
            <select
              value={garageId}
              onChange={(e) => setGarageId(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">No Garage</option>
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Preferred Bike Type</label>
            <select
              value={preferredBikeType}
              onChange={(e) => setPreferredBikeType(e.target.value as BikeTypeId)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {BIKE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Assigned Bike</label>
            <select
              value={bikeId}
              onChange={(e) => setBikeId(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">
                {availableBikes.length === 0 ? "No available bikes" : "Waiting"}
              </option>
              {availableBikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all hover:bg-surface-50 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDuplicateId}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.98] ${
                isDuplicateId
                  ? "bg-surface-200 text-slate-400 cursor-not-allowed"
                  : "bg-brand-600 text-white shadow-brand-200 hover:bg-brand-700 hover:shadow-lg"
              }`}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
