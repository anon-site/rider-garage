"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Plus, UserPlus, Sparkles } from "lucide-react";
import type { Driver } from "@/types/driver";
import type { BikeTypeId } from "@/types/bike";
import { BIKE_TYPES } from "@/types/bike";
import { useBikes } from "@/contexts/bikes-context";
import { useGarages, useDeliveryCategories } from "@/contexts/control-panel-context";
import { useModalBehavior } from "@/hooks/use-modal";
import { driverSchema, type DriverFormData } from "@/lib/schemas";

/* ── Helper: Generate next ID suggestion ── */
function generateNextIdSuggestion(existingIds: string[]): string {
  if (existingIds.length === 0) return "DRV-001";

  // Find IDs that match pattern: PREFIX-NUMBER
  const patterns = existingIds.map(id => {
    const match = id.match(/^([A-Za-z_-]+)(\d+)$/);
    if (match) {
      return { prefix: match[1], number: parseInt(match[2], 10) };
    }
    // Try pattern: PREFIX-NUMBER (with dash)
    const dashMatch = id.match(/^([A-Za-z_-]+)-(\d+)$/);
    if (dashMatch) {
      return { prefix: dashMatch[1] + "-", number: parseInt(dashMatch[2], 10) };
    }
    return null;
  }).filter(Boolean) as { prefix: string; number: number }[];

  if (patterns.length === 0) {
    // No patterns found, suggest based on count
    return `DRV-${String(existingIds.length + 1).padStart(3, "0")}`;
  }

  // Find the most common prefix
  const prefixCounts = patterns.reduce((acc, { prefix }) => {
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonPrefix = Object.entries(prefixCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Find max number for this prefix
  const maxNumber = patterns
    .filter(({ prefix }) => prefix === mostCommonPrefix)
    .reduce((max, { number }) => Math.max(max, number), 0);

  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(3, "0");

  return `${mostCommonPrefix}${paddedNumber}`;
}

type AddDriverModalProps = {
  onSubmit: (driver: Omit<Driver, "id">, customId?: string) => void;
  onClose: () => void;
  existingIds?: string[];
};

export function AddDriverModal({ onSubmit, onClose, existingIds = [] }: AddDriverModalProps) {
  useModalBehavior(true, onClose);
  const { bikes } = useBikes();
  const { garages } = useGarages();
  const { deliveryCategories } = useDeliveryCategories();

  // Only show bikes that are not assigned to any driver
  const availableBikes = useMemo(() => bikes.filter(b => !b.driverId), [bikes]);
  const [customId, setCustomId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [appId, setAppId] = useState("");
  const [garageId, setGarageId] = useState("");
  const [preferredBikeType, setPreferredBikeType] = useState<BikeTypeId>("electric_motorcycle");
  const [bikeId, setBikeId] = useState("");
  const [deliveryCategoryId, setDeliveryCategoryId] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isDuplicateId = customId.trim() !== "" && existingIds.includes(customId.trim());

  // Generate suggestion based on existing IDs
  const suggestedId = useMemo(() => generateNextIdSuggestion(existingIds), [existingIds]);

  // Auto-fill suggestion on first render if no custom ID entered
  useEffect(() => {
    if (!customId && suggestedId) {
      setCustomId(suggestedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationErrors({});
    
    if (isDuplicateId) return;
    
    // Validate with Zod
    const formData: DriverFormData = {
      name,
      phone: phone || "",
      joinDate: joinDate || "",
      appId: appId || "",
      garageId: garageId || "",
      bikeId: bikeId || "",
      notes: "",
    };
    
    const result = driverSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }
    
    if (!name.trim() || !appId.trim()) return;
    const payload: Omit<Driver, "id"> = {
      name,
      phone,
      appId: appId.trim(),
      preferredBikeType,
    };
    if (joinDate) payload.joinDate = joinDate;
    if (garageId) payload.garageId = garageId;
    if (bikeId) payload.bikeId = bikeId;
    if (deliveryCategoryId) payload.deliveryCategoryId = deliveryCategoryId;
    onSubmit(payload, customId.trim() || undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col">
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">
                Driver ID <span className="font-normal text-slate-400">(auto)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="e.g. DRV-001"
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:ring-2 ${
                    isDuplicateId
                      ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                      : customId.trim() && !isDuplicateId
                      ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                      : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                  }`}
                />
              </div>
              {customId !== suggestedId && (
                <button
                  type="button"
                  onClick={() => setCustomId(suggestedId)}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600 ring-1 ring-brand-200 hover:bg-brand-100 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  {suggestedId}
                </button>
              )}
              {isDuplicateId && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                  ID exists
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setValidationErrors(prev => ({ ...prev, name: '' })); }}
                placeholder="e.g. Ali Kareem"
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:ring-2 ${
                  validationErrors.name ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                }`}
              />
              {validationErrors.name && <p className="text-xs text-rose-500">{validationErrors.name}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setValidationErrors(prev => ({ ...prev, phone: '' })); }}
                placeholder="e.g. +964 770 123 4567"
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:ring-2 ${
                  validationErrors.phone ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                }`}
              />
              {validationErrors.phone && <p className="text-xs text-rose-500">{validationErrors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">Join Date</label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">App ID</label>
              <input
                type="text"
                required
                value={appId}
                onChange={(e) => { setAppId(e.target.value); setValidationErrors(prev => ({ ...prev, appId: '' })); }}
                placeholder="e.g. APP-12345"
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-slate-400 outline-none focus:ring-2 ${
                  validationErrors.appId ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                }`}
              />
              {validationErrors.appId && <p className="text-xs text-rose-500">{validationErrors.appId}</p>}
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
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-900">Delivery Category</label>
            <select
              value={deliveryCategoryId}
              onChange={(e) => setDeliveryCategoryId(e.target.value)}
              className="w-full rounded-md border border-surface-200 bg-white px-2.5 py-1 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            >
              <option value="">No Category</option>
              {deliveryCategories
                .filter(cat => cat.isActive !== false)
                .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Plus className="h-4 w-4" />
              Add Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
