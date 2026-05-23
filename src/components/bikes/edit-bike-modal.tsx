"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Save, Bike as BikeIcon } from "lucide-react";
import type { Bike, BikeStatusId, BikeTypeId } from "@/types/bike";
import type { Driver } from "@/types/driver";
import { BIKE_STATUSES, BIKE_TYPES } from "@/types/bike";
import { useDrivers } from "@/contexts/drivers-context";
import { useGarages } from "@/contexts/control-panel-context";

type EditBikeModalProps = {
  bike: Bike | null;
  onSave: (id: string, changes: Partial<Omit<Bike, "id">>) => void;
  onChangeId?: (oldId: string, newId: string) => Promise<void>;
  onClose: () => void;
  existingPlateNumbers?: string[];
  existingIds?: string[];
};

export function EditBikeModal({ bike, onSave, onChangeId, onClose, existingPlateNumbers = [], existingIds = [] }: EditBikeModalProps) {
  const { drivers } = useDrivers();
  const { garages } = useGarages();

  // Show unassigned drivers plus the bike's current driver
  const availableDrivers = useMemo(() => {
    const unassigned = drivers.filter(d => !d.bikeId);
    if (bike?.driverId) {
      const currentDriver = drivers.find(d => d.id === bike.driverId);
      if (currentDriver) {
        return [...unassigned, currentDriver];
      }
    }
    return unassigned;
  }, [drivers, bike?.driverId]);

  const [customId, setCustomId] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState("");
  const [bikeType, setBikeType] = useState<BikeTypeId>("electric_motorcycle");
  const [garageId, setGarageId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState<BikeStatusId>("good");
  const [defectDescription, setDefectDescription] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [notes, setNotes] = useState("");

  const otherPlates = bike ? existingPlateNumbers.filter(p => p !== bike.plateNumber.toLowerCase()) : existingPlateNumbers;
  const otherIds = bike ? existingIds.filter(id => id !== bike.id) : existingIds;
  const isDuplicatePlate = plateNumber.trim() !== "" && otherPlates.includes(plateNumber.trim().toLowerCase());
  const isDuplicateId = customId.trim() !== "" && otherIds.includes(customId.trim());

  useEffect(() => {
    if (bike) {
      setCustomId(bike.id);
      setPlateNumber(bike.plateNumber);
      setColor(bike.color);
      setBikeType(bike.bikeType);
      setGarageId(bike.garageId ?? "");
      setDriverId(bike.driverId ?? "");
      setStatus(bike.status);
      setDefectDescription(bike.defectDescription ?? "");
      setRegistrationDate(bike.registrationDate);
      setNotes(bike.notes ?? "");
    }
  }, [bike]);

  if (!bike) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plateNumber.trim() || !registrationDate || !bike) return;
    if (isDuplicatePlate || isDuplicateId) return;

    // Handle ID change if different
    if (customId.trim() && customId.trim() !== bike.id && onChangeId) {
      await onChangeId(bike.id, customId.trim());
    }

    const changes: Partial<Omit<Bike, "id">> = {
      plateNumber,
      color,
      bikeType,
      status,
      registrationDate,
    };
    changes.garageId = garageId || undefined;
    changes.driverId = driverId || undefined;
    changes.defectDescription = status === "defective" ? defectDescription.trim() || undefined : undefined;
    changes.notes = notes.trim() || undefined;
    // Always use original bike.id - ID change is handled separately by onChangeId
    onSave(bike.id, changes);
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
                <BikeIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Edit Bike</h3>
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
          {/* Bike ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Bike ID</label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value.replace(/\s+/g, ""))}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:ring-2 ${
                isDuplicateId
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                  : customId.trim() && !isDuplicateId && customId.trim() !== bike?.id
                  ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                  : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
              }`}
            />
            {isDuplicateId && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                This ID already exists. Please choose a different one.
              </p>
            )}
            {customId.trim() && !isDuplicateId && customId.trim() !== bike?.id && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ID will be changed on save
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Plate Number</label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:ring-2 ${
                  isDuplicatePlate
                    ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                    : plateNumber.trim() && !isDuplicatePlate
                    ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                    : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                }`}
              />
              {isDuplicatePlate && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                  This plate number already exists.
                </p>
              )}
              {plateNumber.trim() && !isDuplicatePlate && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Plate number is available
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Type</label>
            <select
              value={bikeType}
              onChange={(e) => setBikeType(e.target.value as BikeTypeId)}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">
                  {availableDrivers.length === 0 ? "No available drivers" : "No Driver"}
                </option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BikeStatusId)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {BIKE_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {status === "defective" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Defect Description</label>
              <input
                type="text"
                value={defectDescription}
                onChange={(e) => setDefectDescription(e.target.value)}
                placeholder="Describe the defect"
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Registration Date</label>
            <input
              type="date"
              required
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
            />
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
              disabled={isDuplicatePlate || isDuplicateId}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.98] ${
                isDuplicatePlate || isDuplicateId
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
