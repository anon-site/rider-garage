"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useModalBehavior } from "@/hooks/use-modal";
import { useDriverAttendance } from "@/hooks/use-driver-attendance";
import {
  addAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from "@/lib/attendance-mutations";
import {
  X,
  LogIn,
  LogOut,
  Star,
  MapPin,
  Home,
  Pencil,
  Trash2,
  Save,
  Clock,
  CalendarDays,
  Phone,
  Bike,
  PackageOpen,
  Timer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { Driver } from "@/types/driver";
import type { AttendanceRecord } from "@/types/attendance";
import { useAuth } from "@/contexts/auth-context";

type DriverProfileModalProps = {
  driver: Driver;
  bikeName?: string;
  onClose: () => void;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(exitTime: string, entryTime?: string) {
  if (!entryTime) return "—";
  const start = new Date(exitTime).getTime();
  const end = new Date(entryTime).getTime();
  const hours = (end - start) / (1000 * 60 * 60);
  return `${hours.toFixed(1)} h`;
}

function nowLocal() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromLocalDatetimeValue(local: string) {
  return new Date(local).toISOString();
}

export function DriverProfileModal({ driver, bikeName, onClose }: DriverProfileModalProps) {
  useModalBehavior(true, onClose);
  const { records: driverRecords, hasMore, loadMore } = useDriverAttendance(driver.id);
  const latestRecord = driverRecords[0] ?? null;
  const hasOpenExit = latestRecord && !latestRecord.clockOut;
  const { permissions } = useAuth();
  const canClock = permissions.canClockDriver;

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calBtnRef = useRef<HTMLButtonElement>(null);
  const getCalPos = useCallback(() => {
    const r = calBtnRef.current?.getBoundingClientRect();
    if (!r) return { top: 0, left: 0 };
    return { top: r.bottom + 6, left: Math.max(8, r.right - 280) };
  }, []);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Dates that have records
  const recordDatesSet = useMemo(() => {
    const s = new Set<string>();
    driverRecords.forEach((r) => {
      s.add(new Date(r.clockIn).toISOString().slice(0, 10));
    });
    return s;
  }, [driverRecords]);

  // Filtered records by selected date
  const filteredRecords = useMemo(() => {
    if (!selectedDate) return driverRecords;
    return driverRecords.filter((r) => new Date(r.clockIn).toISOString().slice(0, 10) === selectedDate);
  }, [driverRecords, selectedDate]);

  const latestRating = latestRecord?.rating ?? 100;

  const [exitDate, setExitDate] = useState(nowLocal());

  const [entryDate, setEntryDate] = useState(nowLocal());
  const [entryRating, setEntryRating] = useState(latestRating);
  const [entryOrders, setEntryOrders] = useState(0);

  // Keep the entry rating input in sync with the latest loaded record rating.
  // Without this, useState captures the initial 100 default before records finish loading
  // and never updates, so the user sees 100 even when the driver's real rating is 92.
  useEffect(() => {
    setEntryRating(latestRating);
  }, [latestRating]);

  const [autoTimeEnabled, setAutoTimeEnabled] = useState(true);
  useEffect(() => {
    if (!autoTimeEnabled) return;
    const interval = setInterval(() => {
      const now = nowLocal();
      setExitDate(now);
      setEntryDate(now);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoTimeEnabled]);

  const [editExit, setEditExit] = useState("");
  const [editEntry, setEditEntry] = useState("");
  const [editOrders, setEditOrders] = useState(0);
  const [editRating, setEditRating] = useState(100);
  const [editNotes, setEditNotes] = useState("");

  function handleExit() {
    addAttendanceRecord({
      driverId: driver.id,
      clockIn: fromLocalDatetimeValue(exitDate),
      ordersDelivered: 0,
      rating: latestRating,
    });
  }

  function handleEntry() {
    if (!latestRecord || latestRecord.clockOut) return;
    updateAttendanceRecord(latestRecord.id, {
      clockOut: fromLocalDatetimeValue(entryDate),
      rating: entryRating,
      ordersDelivered: entryOrders,
    });
  }

  function startEdit(record: AttendanceRecord) {
    setEditingRecord(record);
    setEditExit(toLocalDatetimeValue(record.clockIn));
    setEditEntry(record.clockOut ? toLocalDatetimeValue(record.clockOut) : "");
    setEditOrders(record.ordersDelivered);
    setEditRating(record.rating);
    setEditNotes(record.notes ?? "");
  }

  function saveEdit() {
    if (!editingRecord) return;
    const changes: Partial<Omit<AttendanceRecord, "id">> = {
      clockIn: fromLocalDatetimeValue(editExit),
      ordersDelivered: editOrders,
      rating: editRating,
      notes: editNotes.trim() || undefined,
    };
    if (editEntry) {
      changes.clockOut = fromLocalDatetimeValue(editEntry);
    } else {
      changes.clockOut = undefined;
    }
    updateAttendanceRecord(editingRecord.id, changes);
    setEditingRecord(null);
  }

  function confirmDelete(id: string) {
    if (deletingId === id) {
      deleteAttendanceRecord(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  const initials = driver.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* ===== Hero Header ===== */}
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 p-4 sm:p-6 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            {/* Top row: close + status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {hasOpenExit ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                    <MapPin className="h-3 w-3" />
                    Outside
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-white/15">
                    <Home className="h-3 w-3" />
                    Inside
                  </span>
                )}
                {latestRecord && (
                  <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${latestRecord.rating >= 80 ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"}`}>
                    <Star className="h-3 w-3 fill-current" />
                    {latestRecord.rating}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 backdrop-blur-sm ring-1 ring-white/15 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Driver info */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/10 text-lg sm:text-xl font-bold backdrop-blur-md ring-1 ring-white/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold tracking-tight truncate">{driver.name}</h3>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {driver.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ring-1 ring-white/15">
                <CalendarDays className="h-3 w-3" />
                Joined {driver.joinDate ?? "—"}
              </span>
              {bikeName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-medium text-brand-200 ring-1 ring-brand-400/30">
                  <Bike className="h-3 w-3" />
                  {bikeName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== Action Panel ===== */}
        {canClock && <div className="border-b border-surface-100 bg-surface-50/60 p-3 sm:p-5">
          {!hasOpenExit ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5 w-full sm:w-64">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exit Time</label>
                <input
                  type="datetime-local"
                  value={exitDate}
                  onChange={(e) => { setAutoTimeEnabled(false); setExitDate(e.target.value); }}
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <button
                type="button"
                onClick={handleExit}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition-all hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-300 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Record Exit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-medium">
                  Exited at <strong className="text-rose-800">{latestRecord ? formatDateTime(latestRecord.clockIn) : "—"}</strong>
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-[240px_90px_90px]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entry Time</label>
                    <input
                      type="datetime-local"
                      value={entryDate}
                      onChange={(e) => { setAutoTimeEnabled(false); setEntryDate(e.target.value); }}
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rating</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={entryRating}
                      onChange={(e) => setEntryRating(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Orders</label>
                    <input
                      type="number"
                      min={0}
                      value={entryOrders}
                      onChange={(e) => setEntryOrders(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEntry}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-300 active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  Record Entry
                </button>
              </div>
            </div>
          )}
        </div>}

        {/* ===== Shift History ===== */}
        <div className="flex-1 overflow-y-auto bg-white p-3 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Shift History</h4>
            <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              {filteredRecords.length}
              {selectedDate ? ` / ${driverRecords.length}` : ""}
            </span>
            {driverRecords.length > 0 && (
              <div className="relative ml-auto flex items-center gap-2">
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => { setSelectedDate(null); setCalendarOpen(false); }}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-surface-200 transition-all hover:bg-surface-100"
                    title="Reset filter"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  ref={calBtnRef}
                  type="button"
                  onClick={() => setCalendarOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    calendarOpen || selectedDate
                      ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                      : "bg-surface-100 text-slate-600 ring-1 ring-surface-200 hover:bg-surface-200"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {selectedDate ? selectedDate : "Calendar"}
                </button>

                {/* Mini Calendar Popover */}
                {calendarOpen && (() => {
                  const { year, month } = calMonth;
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const monthName = new Date(year, month).toLocaleString("en", { month: "long", year: "numeric" });
                  const today = new Date().toISOString().slice(0, 10);
                  const days: (number | null)[] = [...Array.from<null>({ length: firstDay }).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

                  return (
                    <>
                      <div className="fixed inset-0 z-[70]" onClick={() => setCalendarOpen(false)} />
                      <div className="fixed z-[80] w-[280px] rounded-xl border border-surface-200 bg-white p-3 shadow-xl ring-1 ring-black/5" style={getCalPos()}>
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            onClick={() => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-surface-100"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <h5 className="text-xs font-bold text-surface-900">{monthName}</h5>
                          <button
                            type="button"
                            onClick={() => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-surface-100"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 text-center">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                            <div key={d} className="py-1 text-[9px] font-semibold uppercase text-slate-400">{d}</div>
                          ))}
                          {days.map((day, i) => {
                            if (day === null) return <div key={`e-${i}`} />;
                            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const hasRecord = recordDatesSet.has(dateStr);
                            const isSelected = selectedDate === dateStr;
                            const isToday = dateStr === today;
                            return (
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => { setSelectedDate(isSelected ? null : dateStr); if (!isSelected) setCalendarOpen(false); }}
                                className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium transition-all ${
                                  isSelected
                                    ? "bg-brand-600 text-white shadow-sm"
                                    : hasRecord
                                    ? "bg-brand-100 text-brand-700 hover:bg-brand-200 font-bold"
                                    : isToday
                                    ? "bg-surface-200 text-surface-900 font-bold"
                                    : "text-slate-500 hover:bg-surface-50"
                                }`}
                              >
                                {day}
                                {hasRecord && !isSelected && (
                                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {selectedDate && (
                          <div className="mt-2 flex items-center justify-between border-t border-surface-100 pt-2">
                            <span className="text-[11px] font-medium text-brand-700">
                              {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
                            </span>
                            <button type="button" onClick={() => { setSelectedDate(null); setCalendarOpen(false); }} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {driverRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-12 text-center">
              <PackageOpen className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-400">No shift records yet</p>
            </div>
          ) : filteredRecords.length === 0 && selectedDate ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-10 text-center">
              <CalendarDays className="h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">No work on this day</p>
              <p className="mt-1 text-xs text-slate-400">{selectedDate}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record, idx) => (
                <div key={record.id}>
                  {editingRecord?.id === record.id ? (
                    <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-700">Exit</label>
                          <input
                            type="datetime-local"
                            value={editExit}
                            onChange={(e) => setEditExit(e.target.value)}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-700">Entry</label>
                          <input
                            type="datetime-local"
                            value={editEntry}
                            onChange={(e) => setEditEntry(e.target.value)}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-700">Rating</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editRating}
                            onChange={(e) => setEditRating(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-700">Orders</label>
                          <input
                            type="number"
                            min={0}
                            value={editOrders}
                            onChange={(e) => setEditOrders(Math.max(0, Number(e.target.value)))}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-700">Notes</label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingRecord(null)}
                          className="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-semibold text-surface-700 transition-colors hover:bg-surface-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative flex flex-col gap-3 rounded-2xl border border-surface-200 bg-surface-50/40 p-4 transition-all hover:border-surface-300 hover:bg-surface-50 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      {/* Timeline dot */}
                      <div className="absolute -left-[5px] top-5 hidden h-2.5 w-2.5 rounded-full bg-surface-300 ring-4 ring-white sm:block" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm ring-1 ring-surface-200">
                            #{filteredRecords.length - idx}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {formatHours(record.clockIn, record.clockOut)}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Exit</div>
                            <div className="mt-0.5 font-semibold text-surface-900">{formatDateTime(record.clockIn)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Entry</div>
                            <div className="mt-0.5 font-semibold text-surface-900">
                              {record.clockOut ? formatDateTime(record.clockOut) : <span className="text-amber-600">Pending</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Orders</div>
                            <div className="mt-0.5 font-semibold text-surface-900">{record.ordersDelivered}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rating</div>
                            <div className={`mt-0.5 inline-flex items-center gap-1 font-bold ${record.rating >= 80 ? "text-emerald-600" : "text-rose-600"}`}>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {record.rating > 0 ? record.rating : "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {canClock && (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(record)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 shadow-sm transition-all hover:bg-surface-100 hover:text-surface-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(record.id)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs shadow-sm transition-all ${
                              deletingId === record.id
                                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border-surface-200 bg-white text-surface-500 hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {canClock && deletingId === record.id && (
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-slate-400 transition-colors hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {hasMore && !selectedDate && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Load more history
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
