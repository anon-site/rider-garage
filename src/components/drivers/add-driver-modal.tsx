"use client";

import { useState } from "react";
import { X, Plus, UserPlus } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { BikeTypeId } from "@/types/bike";
import { BIKE_TYPES } from "@/types/bike";
import { useBikes } from "@/contexts/bikes-context";
import { useGarages } from "@/contexts/control-panel-context";

type AddDriverModalProps = {
  onSubmit: (driver: Omit<Driver, "id">) => void;
  onClose: () => void;
};

export function AddDriverModal({ onSubmit, onClose }: AddDriverModalProps) {
  const { bikes } = useBikes();
  const { garages } = useGarages();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [email, setEmail] = useState("");
  const [garageId, setGarageId] = useState("");
  const [preferredBikeType, setPreferredBikeType] = useState<BikeTypeId>("electric_motorcycle");
  const [bikeId, setBikeId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !joinDate) return;
    const payload: Omit<Driver, "id"> = {
      name,
      phone,
      joinDate,
      preferredBikeType,
    };
    if (email.trim()) payload.email = email.trim();
    if (garageId) payload.garageId = garageId;
    if (bikeId) payload.bikeId = bikeId;
    onSubmit(payload);
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
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Add New Driver</h3>
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
            <label className="text-sm font-medium text-surface-900">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ali Kareem"
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +964 770 123 4567"
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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
              placeholder="e.g. ali@example.com"
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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
            <label className="text-sm font-medium text-surface-900">Assigned Bike <span className="font-normal text-slate-400">(optional)</span></label>
            <select
              value={bikeId}
              onChange={(e) => setBikeId(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Waiting (No bike)</option>
              {bikes.map((b) => (
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
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
