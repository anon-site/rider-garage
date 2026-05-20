"use client";

import { useState } from "react";
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
  const { addRecord, updateRecord, deleteRecord, getRecordsByDriver, getLatestRecord } =
    useAttendance();
  const { permissions } = useAuth();
  const canClock = permissions.canClockDriver;
  const hasBike = !!driver.bikeId;
  const driverRecords = getRecordsByDriver(driver.id);
  const latestRecord = getLatestRecord(driver.id);
  const hasOpenExit = latestRecord && !latestRecord.clockOut;

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  function confirmDelete(id: string) {
    if (deletingId === id) {
      deleteRecord(id);
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
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* ===== Hero Header ===== */}
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 p-6 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold backdrop-blur-md ring-1 ring-white/20">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold tracking-tight">{driver.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {driver.phone}
                  </span>
                  {driver.email && (
                    <span className="hidden sm:inline-flex items-center gap-1.5">
                      {driver.email}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium backdrop-blur-sm ring-1 ring-white/15">
                    <CalendarDays className="h-3 w-3" />
                    Joined {driver.joinDate}
                  </span>
                  {bikeName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-2.5 py-1 text-xs font-medium text-brand-200 ring-1 ring-brand-400/30">
                      <Bike className="h-3 w-3" />
                      {bikeName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasOpenExit ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  <MapPin className="h-3 w-3" />
                  Outside
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-white/15">
                  <Home className="h-3 w-3" />
                  Inside
                </span>
              )}
              {latestRecord && (
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${latestRecord.rating >= 80 ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"}`}>
                  <Star className="h-3 w-3 fill-current" />
                  {latestRecord.rating}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 backdrop-blur-sm ring-1 ring-white/15 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ===== Action Panel ===== */}
        {canClock && <div className="border-b border-surface-100 bg-surface-50/60 p-5">
          {!hasBike && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <Bike className="h-4 w-4 shrink-0 text-amber-500" />
              <span>No bike assigned — actions are disabled until a bike is assigned to this driver.</span>
            </div>
          )}
          {!hasOpenExit ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-4 sm:flex sm:items-end sm:gap-4 sm:space-y-0">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exit Time</label>
                  <input
                    type="datetime-local"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div className="w-full sm:w-32 space-y-1.5">
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
                disabled={!hasBike}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition-all hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-rose-600"
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-4 sm:flex sm:items-end sm:gap-4 sm:space-y-0">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entry Time</label>
                    <input
                      type="datetime-local"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="w-full sm:w-32 space-y-1.5">
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
                  <div className="w-full sm:w-40 space-y-1.5">
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
                  disabled={!hasBike}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-emerald-600"
                >
                  <LogIn className="h-4 w-4" />
                  Record Entry
                </button>
              </div>
            </div>
          )}
        </div>}

        {/* ===== Shift History ===== */}
        <div className="flex-1 overflow-y-auto bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Shift History</h4>
            <span className="ml-auto rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              {driverRecords.length}
            </span>
          </div>

          {driverRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-12 text-center">
              <PackageOpen className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-400">No shift records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {driverRecords.map((record, idx) => (
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
                            #{driverRecords.length - idx}
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
                            disabled={!hasBike}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 shadow-sm transition-all hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(record.id)}
                            disabled={!hasBike}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
