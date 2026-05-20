"use client";

import { useState, useEffect } from "react";
import { X, Save, Bike as BikeIcon } from "lucide-react";
import type { Bike, BikeStatusId, BikeTypeId } from "@/types/bike";
import { BIKE_STATUSES, BIKE_TYPES } from "@/types/bike";
import { useDrivers } from "@/contexts/drivers-context";
import { useGarages } from "@/contexts/control-panel-context";

type EditBikeModalProps = {
  bike: Bike | null;
  onSave: (id: string, changes: Partial<Omit<Bike, "id">>) => void;
  onClose: () => void;
};

export function EditBikeModal({ bike, onSave, onClose }: EditBikeModalProps) {
  const { drivers } = useDrivers();
  const { garages } = useGarages();
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState("");
  const [bikeType, setBikeType] = useState<BikeTypeId>("electric_motorcycle");
  const [garageId, setGarageId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState<BikeStatusId>("good");
  const [defectDescription, setDefectDescription] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (bike) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plateNumber.trim() || !registrationDate || !bike) return;
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Plate Number</label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
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
                <option value="">No Driver</option>
                {drivers.map((d) => (
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
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]"
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
