"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useModalBehavior } from "@/hooks/use-modal";
import {
  X,
  LogIn,
  LogOut,
  Star,
  MapPin,
  Home,
  Pencil,
  Trash2,
  Clock,
  CalendarDays,
  Phone,
  Bike,
  PackageOpen,
  Timer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Driver } from "@/types/driver";
import type { AttendanceRecord } from "@/types/attendance";
import { useAttendance } from "@/contexts/attendance-context";
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

function nowISO() {
  return new Date().toISOString().slice(0, 16);
}

export function DriverProfileModal({ driver, bikeName, onClose }: DriverProfileModalProps) {
  useModalBehavior(true, onClose);
  const { addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord, currentMonth, loadMonth } =
    useAttendance();
  const { permissions } = useAuth();
  const canClock = permissions.canClockDriver;
  const driverRecords = getRecordsByDriver(driver.id);
  const latestRecord = getLatestRecord(driver.id);
  const hasOpenExit = latestRecord && !latestRecord.clockOut;

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

  // State for month navigation
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Load different month data
  const loadDifferentMonth = useCallback(async (year: number, month: number) => {
    if (year === currentMonth.year && month === currentMonth.month) {
      // Already loaded, no need to reload
      setViewMonth({ year, month });
      return;
    }
    
    setLoadingMonth(true);
    try {
      await loadMonth(year, month);
      setViewMonth({ year, month });
    } catch (error) {
      console.error('Error loading different month:', error);
    } finally {
      setLoadingMonth(false);
    }
  }, [currentMonth, loadMonth]);

  // Navigate to previous/next month
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(viewMonth.year, viewMonth.month - 1); // month is 1-based
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth() + 1; // Convert back to 1-based
    loadDifferentMonth(newYear, newMonth);
  }, [viewMonth, loadDifferentMonth]);

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

  const [exitDate, setExitDate] = useState(nowISO());
  const [exitRating, setExitRating] = useState(80);

  const [entryDate, setEntryDate] = useState(nowISO());
  const [entryRating, setEntryRating] = useState(80);
  const [entryOrders, setEntryOrders] = useState(0);

  const [editExit, setEditExit] = useState("");
  const [editEntry, setEditEntry] = useState("");
  const [editOrders, setEditOrders] = useState(0);
  const [editRating, setEditRating] = useState(80);
  const [editNotes, setEditNotes] = useState("");

  function handleExit() {
    addRecord({
      driverId: driver.id,
      clockIn: new Date(exitDate).toISOString(),
      ordersDelivered: 0,
      rating: exitRating,
    });
  }

  function handleEntry() {
    if (!latestRecord || latestRecord.clockOut) return;
    updateRecord(latestRecord.id, {
      clockOut: new Date(entryDate).toISOString(),
      rating: entryRating,
      ordersDelivered: entryOrders,
    });
  }

  function startEdit(record: AttendanceRecord) {
    setEditingRecord(record);
    setEditExit(record.clockIn.slice(0, 16));
    setEditEntry(record.clockOut ? record.clockOut.slice(0, 16) : "");
    setEditOrders(record.ordersDelivered);
    setEditRating(record.rating);
    setEditNotes(record.notes ?? "");
  }

  function saveEdit() {
    if (!editingRecord) return;
    const changes: Partial<Omit<AttendanceRecord, "id">> = {
      clockIn: new Date(editExit).toISOString(),
      ordersDelivered: editOrders,
      rating: editRating,
      notes: editNotes.trim() || undefined,
    };
    if (editEntry) {
      changes.clockOut = new Date(editEntry).toISOString();
    } else {
      changes.clockOut = undefined;
    }
    updateRecord(editingRecord.id, changes);
    setEditingRecord(null);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteRecord(deletingId);
    setDeletingId(null);
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
                <h2 className="text-lg sm:text-xl font-bold text-white">{driver.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {driver.phone}
                  </span>
                  {driver.appId && (
                    <span className="inline-flex items-center gap-1">
                      <PackageOpen className="h-3 w-3" />
                      {driver.appId}
                    </span>
                  )}
                  {bikeName && (
                    <span className="inline-flex items-center gap-1">
                      <Bike className="h-3 w-3" />
                      {bikeName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Clock In/Out Section ===== */}
        {canClock && (
          <div className="border-b border-surface-200 bg-surface-50 p-4 sm:p-5">
            {!hasOpenExit ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid grid-cols-[1fr_90px] gap-3 sm:grid-cols-[240px_90px]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exit Time</label>
                    <input
                      type="datetime-local"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rating</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={exitRating}
                      onChange={(e) => setExitRating(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
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
                    Exited at <strong className="text-rose-800">{formatDateTime(latestRecord!.clockIn)}</strong>
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-[240px_90px_90px]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entry Time</label>
                      <input
                        type="datetime-local"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
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
          </div>
        )}

        {/* ===== Shift History ===== */}
        <div className="flex-1 overflow-y-auto bg-white p-3 sm:p-5">
          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Shift History</h4>
              <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                {filteredRecords.length}{selectedDate ? ` / ${driverRecords.length}` : ""}
              </span>
            </div>
            
            {/* Month Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                disabled={loadingMonth}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-surface-200 transition-all hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              
              <div className="rounded-xl bg-surface-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {new Date(viewMonth.year, viewMonth.month - 1).toLocaleString('en', { month: 'short', year: 'numeric' })}
                {loadingMonth && (
                  <div className="inline-block h-3 w-3 ml-2 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                )}
              </div>
              
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                disabled={loadingMonth}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-surface-200 transition-all hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              
              {/* Back to current month button */}
              {(viewMonth.year !== currentMonth.year || viewMonth.month !== currentMonth.month) && (
                <button
                  type="button"
                  onClick={() => loadDifferentMonth(currentMonth.year, currentMonth.month)}
                  disabled={loadingMonth}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 transition-all hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Back to current month"
                >
                  <Timer className="h-3.5 w-3.5" />
                  Current
                </button>
              )}
            </div>
          </div>
          
          {/* Calendar and Filter Controls */}
          {driverRecords.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
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
            </div>
          )}

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
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d} className="text-[10px] font-semibold text-slate-500 py-1">
                        {d}
                      </div>
                    ))}
                    {days.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} />;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const hasRecord = recordDatesSet.has(dateStr);
                      const isToday = dateStr === today;
                      const isSelected = dateStr === selectedDate;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setCalendarOpen(false);
                          }}
                          className={`relative flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-brand-600 text-white shadow-sm"
                              : isToday
                              ? "bg-surface-100 text-surface-900 ring-1 ring-surface-300"
                              : hasRecord
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                              : "text-slate-600 hover:bg-surface-50"
                          }`}
                        >
                          {day}
                          {hasRecord && (
                            <div className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDate && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-50 px-2 py-1">
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

        {driverRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-12 text-center">
            <PackageOpen className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-400">No shift records yet</p>
          </div>
        ) : filteredRecords.length === 0 && selectedDate ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-10 text-center">
            <CalendarDays className="h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No work on this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div key={record.id} className="group relative rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-surface-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        record.rating >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        <Star className="h-3 w-3 fill-current" />
                        {record.rating}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatHours(record.clockIn, record.clockOut)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <LogOut className="h-3.5 w-3. text-rose-500" />
                        <span className="font-medium text-surface-900">{formatDateTime(record.clockIn)}</span>
                      </div>
                      {record.clockOut && (
                        <div className="flex items-center gap-2 text-sm">
                          <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-medium text-surface-900">{formatDateTime(record.clockOut)}</span>
                        </div>
                      )}
                      {record.ordersDelivered > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <PackageOpen className="h-3.5 w-3.5" />
                          <span>{record.ordersDelivered} orders delivered</span>
                        </div>
                      )}
                      {record.notes && (
                        <div className="text-xs text-slate-500 italic mt-1">{record.notes}</div>
                      )}
                    </div>
                  </div>
                  {canClock && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(record)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-surface-100 hover:text-slate-600"
                        title="Edit record"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Record Modal */}
        {editingRecord && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <h3 className="text-lg font-bold text-surface-900 mb-4">Edit Record</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Exit Time</label>
                    <input
                      type="datetime-local"
                      value={editExit}
                      onChange={(e) => setEditExit(e.target.value)}
                      className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Time</label>
                    <input
                      type="datetime-local"
                      value={editEntry}
                      onChange={(e) => setEditEntry(e.target.value)}
                      className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Orders</label>
                    <input
                      type="number"
                      min={0}
                      value={editOrders}
                      onChange={(e) => setEditOrders(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editRating}
                      onChange={(e) => setEditRating(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 rounded-lg border border-surface-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-surface-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900">Delete Record</h3>
                  <p className="text-sm text-slate-600">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 rounded-lg border border-surface-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-surface-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
