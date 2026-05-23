"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  TrendingUp, Package, Star, Clock, Users,
  Bike as BikeIcon, Warehouse, Calendar, Download,
  ChevronDown, ChevronUp, Filter, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Minus,
  FileText, Activity, ShieldOff, FileSpreadsheet, Loader2,
} from "lucide-react";
import { exportPDF, exportExcel } from "@/lib/export-utils";
import { useAttendance } from "@/contexts/attendance-context";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useGarages } from "@/contexts/control-panel-context";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

/* ── helpers ─────────────────────────────────────────────────────── */
function calcHours(clockIn: string, clockOut?: string) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return Math.max(0, (end - start) / 3_600_000);
}
function fmtHours(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h ${mm}m`;
}
function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/* ── types ── */
type Period = "7d" | "30d" | "all";

/* ── KPI Card ──────────────────────────────────────────────────────── */
type Tone = "brand" | "emerald" | "amber" | "rose" | "violet" | "sky";
const toneMap: Record<Tone, { grad: string; icon: string; badge: string }> = {
  brand:   { grad: "from-brand-500/20 to-brand-500/5",   icon: "from-brand-500 to-brand-600 text-white",   badge: "bg-brand-50 text-brand-700 ring-brand-200" },
  emerald: { grad: "from-emerald-500/20 to-emerald-500/5", icon: "from-emerald-500 to-emerald-600 text-white", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  amber:   { grad: "from-amber-500/20 to-amber-500/5",   icon: "from-amber-400 to-amber-600 text-white",   badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  rose:    { grad: "from-rose-500/20 to-rose-500/5",     icon: "from-rose-500 to-rose-600 text-white",     badge: "bg-rose-50 text-rose-700 ring-rose-200" },
  violet:  { grad: "from-violet-500/20 to-violet-500/5", icon: "from-violet-500 to-violet-600 text-white", badge: "bg-violet-50 text-violet-700 ring-violet-200" },
  sky:     { grad: "from-sky-500/20 to-sky-500/5",       icon: "from-sky-400 to-sky-600 text-white",       badge: "bg-sky-50 text-sky-700 ring-sky-200" },
};

function KpiCard({ icon: Icon, label, value, sub, trend, tone = "brand" }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; trend?: { val: number; label: string }; tone?: Tone;
}) {
  const t = toneMap[tone];
  return (
    <div className="glass-panel relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 ring-1 ring-white/60">
      <div className={`pointer-events-none absolute -right-4 sm:-right-6 -top-4 sm:-top-6 h-20 sm:h-24 w-20 sm:w-24 rounded-full bg-gradient-to-br ${t.grad} blur-2xl`} />
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest text-slate-400 truncate">{label}</p>
          <p className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900">{value}</p>
          {sub && <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs text-slate-500">{sub}</p>}
          {trend && (
            <span className={cn(
              "mt-1.5 sm:mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ring-1",
              trend.val > 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : trend.val < 0 ? "bg-rose-50 text-rose-700 ring-rose-200"
              : "bg-slate-50 text-slate-500 ring-slate-200"
            )}>
              {trend.val > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend.val < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span className="truncate">{trend.label}</span>
            </span>
          )}
        </div>
        <span className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br shadow-lg ${t.icon}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

/* ── Mini Bar Chart ────────────────────────────────────────────────── */
function MiniBarChart({ data, color = "bg-brand-500" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={cn("w-full rounded-t-md transition-all", color)}
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          />
          <span className="text-[9px] font-medium text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Star Rating ───────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} className={cn("h-3.5 w-3.5", i <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} viewBox="0 0 24 24" strokeWidth={1}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-500">{rating.toFixed(1)}</span>
    </span>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export function ReportsSection() {
  const { records } = useAttendance();
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { garages } = useGarages();
  const { user, permissions } = useAuth();

  // Hide garages for garage managers and supervisors
  const isGarageManager = user?.role === "garage";
  const isSupervisor = user?.role === "supervisor";
  const hideGaragesTab = isGarageManager || isSupervisor;

  const [period, setPeriod] = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "drivers" | "fleet" | "garages">(
    isGarageManager ? "overview" : "overview"
  );
  const [sortBy, setSortBy] = useState<"orders" | "rating" | "hours">("orders");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Filter records by period ── */
  const filteredRecords = useMemo(() => {
    if (period === "all") return records;
    const days = period === "7d" ? 7 : 30;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    return records.filter((r) => new Date(r.clockIn) >= cutoff);
  }, [records, period]);

  /* ── KPI Aggregates ── */
  const kpi = useMemo(() => {
    const totalOrders = filteredRecords.reduce((s, r) => s + (r.ordersDelivered ?? 0), 0);
    const totalHours  = filteredRecords.reduce((s, r) => s + calcHours(r.clockIn, r.clockOut), 0);
    const avgRating   = filteredRecords.length > 0
      ? filteredRecords.reduce((s, r) => s + r.rating, 0) / filteredRecords.length : 0;
    const activeSessions = records.filter((r) => !r.clockOut).length;
    const bikesGood   = bikes.filter((b) => b.status === "good").length;
    const bikesIssue  = bikes.filter((b) => b.status !== "good").length;
    const uniqueDrivers = new Set(filteredRecords.map((r) => r.driverId)).size;
    return { totalOrders, totalHours, avgRating, activeSessions, bikesGood, bikesIssue, uniqueDrivers, totalSessions: filteredRecords.length };
  }, [filteredRecords, records, bikes]);

  /* ── Driver summaries ── */
  const driverStats = useMemo(() => {
    return drivers.map((d) => {
      const dRec = filteredRecords.filter((r) => r.driverId === d.id);
      const orders = dRec.reduce((s, r) => s + r.ordersDelivered, 0);
      const hours  = dRec.reduce((s, r) => s + calcHours(r.clockIn, r.clockOut), 0);
      const rating = dRec.length > 0 ? dRec.reduce((s, r) => s + r.rating, 0) / dRec.length : 0;
      const bike   = d.bikeId ? bikes.find((b) => b.id === d.bikeId) : undefined;
      const isActive = records.some((r) => r.driverId === d.id && !r.clockOut);
      return { ...d, orders, hours, rating, sessions: dRec.length, bike, isActive };
    }).sort((a, b) => {
      const key = sortBy;
      const diff = b[key] - a[key];
      return sortDir === "desc" ? diff : -diff;
    });
  }, [drivers, filteredRecords, records, bikes, sortBy, sortDir]);

  /* ── Daily orders trend (last 7 or 30 days) ── */
  const dailyTrend = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 14 : 14;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      const dayRec = filteredRecords.filter((r) => r.clockIn.slice(0, 10) === key);
      return { label: fmtShortDate(d.toISOString()), value: dayRec.reduce((s, r) => s + r.ordersDelivered, 0) };
    });
  }, [filteredRecords, period]);

  /* ── Garage stats ── */
  const garageStats = useMemo(() => {
    return garages.map((g) => {
      const gDrivers = drivers.filter((d) => d.garageId === g.id);
      const gBikes   = bikes.filter((b) => b.garageId === g.id);
      const gRec     = filteredRecords.filter((r) => gDrivers.some((d) => d.id === r.driverId));
      const orders   = gRec.reduce((s, r) => s + r.ordersDelivered, 0);
      const rating   = gRec.length > 0 ? gRec.reduce((s, r) => s + r.rating, 0) / gRec.length : 0;
      return { ...g, driverCount: gDrivers.length, bikeCount: gBikes.length, orders, rating };
    });
  }, [garages, drivers, bikes, filteredRecords]);

  /* ── Export handler ── */
  async function handleExport(type: "pdf" | "excel") {
    setExportOpen(false);
    setExporting(type);
    const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));
    // Exclude garageStats for garage managers in export
    const exportData = isGarageManager
      ? { driverStats, bikes, filteredRecords, driverMap }
      : { driverStats, bikes, garageStats, filteredRecords, driverMap };
    try {
      if (type === "pdf") await exportPDF(exportData, period);
      else await exportExcel(exportData, period);
    } finally {
      setExporting(null);
    }
  }

  /* ── Access guard ── */
  if (!permissions.canViewReports) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-100 bg-rose-50/60 py-24 text-center shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 mb-5">
          <ShieldOff className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <h2 className="text-xl font-bold text-surface-900">Access Denied</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          You don&apos;t have permission to view reports. Ask your admin to grant you the <strong>View Reports</strong> permission.
        </p>
      </div>
    );
  }

  /* ── Sort toggle helper ── */
  function toggleSort(col: "orders" | "rating" | "hours") {
    if (sortBy === col) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  }
  function SortIcon({ col }: { col: "orders" | "rating" | "hours" }) {
    if (sortBy !== col) return <ChevronDown className="h-3.5 w-3.5 text-slate-300" />;
    return sortDir === "desc" ? <ChevronDown className="h-3.5 w-3.5 text-brand-500" /> : <ChevronUp className="h-3.5 w-3.5 text-brand-500" />;
  }

  const TABS = [
    { id: "overview" as const, label: "Overview",     icon: Activity },
    { id: "drivers" as const,  label: "Drivers",      icon: Users },
    { id: "fleet" as const,    label: "Fleet",        icon: BikeIcon },
    ...(!hideGaragesTab ? [{ id: "garages" as const, label: "Garages", icon: Warehouse }] : []),
  ];

  const PERIODS: { id: Period; label: string }[] = [
    { id: "7d",  label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "all", label: "All time" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex w-full sm:w-auto items-center gap-1 rounded-2xl bg-surface-100 p-1 ring-1 ring-surface-200">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as "overview" | "drivers" | "fleet" | "garages")}
              className={cn(
                "flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all",
                activeTab === id
                  ? "bg-white text-brand-600 shadow-sm ring-1 ring-surface-200"
                  : "text-slate-500 hover:text-surface-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Period selector + Export hint */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 rounded-xl border border-surface-200 bg-white p-1 shadow-sm">
            {PERIODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriod(id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  period === id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-surface-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* ── Export Dropdown ── */}
          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              disabled={!!exporting}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:bg-surface-50",
                exporting ? "cursor-wait text-slate-400" : "text-slate-700 hover:border-brand-300 hover:text-brand-700",
                exportOpen && "border-brand-300 text-brand-700 ring-2 ring-brand-100"
              )}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? (exporting === "pdf" ? "Generating PDF…" : "Generating Excel…") : "Export"}
              {!exporting && <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", exportOpen && "rotate-180")} />}
            </button>

            {exportOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-2xl shadow-surface-900/10 ring-1 ring-black/5">
                {/* Dropdown header */}
                <div className="border-b border-surface-100 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Export Report</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "All time"}
                  </p>
                </div>

                {/* PDF option */}
                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-rose-50 group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 group-hover:bg-rose-200 transition-colors">
                    <FileText className="h-4 w-4 text-rose-600" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-surface-900 group-hover:text-rose-700">Export as PDF</div>
                    <div className="text-[11px] text-slate-400">Drivers · Fleet · Garages</div>
                  </div>
                  <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200">PDF</span>
                </button>

                {/* Divider */}
                <div className="mx-4 border-t border-surface-100" />

                {/* Excel option */}
                <button
                  type="button"
                  onClick={() => handleExport("excel")}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-emerald-50 group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-surface-900 group-hover:text-emerald-700">Export as Excel</div>
                    <div className="text-[11px] text-slate-400">4 sheets · .xlsx format</div>
                  </div>
                  <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">XLSX</span>
                </button>

                {/* Footer note */}
                <div className="border-t border-surface-100 px-4 py-2.5">
                  <p className="text-[10px] text-slate-400">
                    Includes current filter: <span className="font-semibold text-slate-500">{period === "7d" ? "7 days" : period === "30d" ? "30 days" : "all records"}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <KpiCard icon={Package}    label="Total Orders"    value={kpi.totalOrders}                      sub={`${kpi.totalSessions} sessions`}            tone="brand"   />
        <KpiCard icon={Clock}      label="Total Hours"     value={fmtHours(kpi.totalHours)}             sub={`${kpi.uniqueDrivers} active`}      tone="sky"     />
        <KpiCard icon={Star}       label="Avg. Rating"     value={kpi.avgRating.toFixed(1)}             sub="performance"                         tone="amber"   />
        <KpiCard icon={Activity}   label="Live Sessions"   value={kpi.activeSessions}                   sub="on shift"                 tone={kpi.activeSessions > 0 ? "emerald" : "rose"} />
      </div>

      {/* ════════════════════════════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Orders trend + Fleet health */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Orders trend chart */}
            <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-surface-900">Orders Trend</h3>
                  <p className="text-xs text-slate-400">Daily delivery volume</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                  <TrendingUp className="h-3 w-3" />
                  {kpi.totalOrders} total
                </span>
              </div>
              <MiniBarChart data={dailyTrend} color="bg-brand-500" />
            </div>

            {/* Fleet health */}
            <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-surface-900">Fleet Health</h3>
                  <p className="text-xs text-slate-400">Bike status distribution</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  <BikeIcon className="h-3 w-3" />
                  {bikes.length} bikes
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Good Condition",   count: bikes.filter((b) => b.status === "good").length,        color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
                  { label: "In Maintenance",   count: bikes.filter((b) => b.status === "maintenance").length, color: "bg-amber-500",   light: "bg-amber-50 text-amber-700 ring-amber-200" },
                  { label: "Defective",        count: bikes.filter((b) => b.status === "defective").length,   color: "bg-rose-500",    light: "bg-rose-50 text-rose-700 ring-rose-200" },
                ].map(({ label, count, color, light }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-surface-800">{label}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", light)}>{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                      <div
                        className={cn("h-full rounded-full transition-all", color)}
                        style={{ width: bikes.length > 0 ? `${(count / bikes.length) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-surface-100">
                <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-100">
                  <p className="text-2xl font-extrabold text-emerald-700">{kpi.bikesGood}</p>
                  <p className="text-[11px] font-semibold text-emerald-600">Operational</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3 text-center ring-1 ring-rose-100">
                  <p className="text-2xl font-extrabold text-rose-700">{kpi.bikesIssue}</p>
                  <p className="text-[11px] font-semibold text-rose-600">Need Attention</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top drivers quick view */}
          <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Top Performers</h3>
                <p className="text-xs text-slate-400">Ranked by orders delivered</p>
              </div>
              <button type="button" onClick={() => setActiveTab("drivers")}
                className="text-xs font-semibold text-brand-600 hover:underline">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {driverStats.slice(0, 5).map((d, i) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl bg-surface-50/80 px-4 py-3 ring-1 ring-surface-100">
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-surface-100 text-slate-400"
                  )}>#{i + 1}</span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                    {d.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-surface-900">{d.name}</p>
                    <p className="text-[11px] text-slate-400">{d.sessions} sessions · {fmtHours(d.hours)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-surface-900">{d.orders} orders</span>
                    <StarRating rating={Math.round(d.rating)} />
                  </div>
                  {d.isActive && (
                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse" />
                  )}
                </div>
              ))}
              {driverStats.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">No records in this period.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          DRIVERS TAB
      ════════════════════════════════════════════════════════ */}
      {activeTab === "drivers" && (
        <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-surface-900">Driver Performance Report</h3>
              <p className="text-xs text-slate-400">{driverStats.length} drivers · {period === "all" ? "All time" : period === "7d" ? "Last 7 days" : "Last 30 days"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-surface-200">
                <Filter className="h-3 w-3" />
                Sort by
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">ID</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Driver</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bike</th>
                  <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <button type="button" onClick={() => toggleSort("orders")} className="inline-flex items-center gap-1 hover:text-surface-900">
                      Orders <SortIcon col="orders" />
                    </button>
                  </th>
                  <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <button type="button" onClick={() => toggleSort("hours")} className="inline-flex items-center gap-1 hover:text-surface-900">
                      Hours <SortIcon col="hours" />
                    </button>
                  </th>
                  <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sessions</th>
                  <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <button type="button" onClick={() => toggleSort("rating")} className="inline-flex items-center gap-1 hover:text-surface-900">
                      Rating <SortIcon col="rating" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {driverStats.map((d) => (
                  <tr key={d.id} className="group hover:bg-surface-50/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex items-center rounded-lg bg-surface-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {d.id}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900">{d.name}</p>
                          <p className="text-[11px] text-slate-400">{d.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      {d.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      {d.bike ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-surface-800">{d.bike.plateNumber}</span>
                          <span className={cn("text-[10px] font-semibold", d.bike.status === "good" ? "text-emerald-600" : d.bike.status === "maintenance" ? "text-amber-600" : "text-rose-600")}>
                            {d.bike.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">— No bike</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className="font-extrabold text-surface-900">{d.orders}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-right text-slate-600">{fmtHours(d.hours)}</td>
                    <td className="py-3.5 pr-4 text-right text-slate-600">{d.sessions}</td>
                    <td className="py-3.5 text-right"><StarRating rating={Math.round(d.rating)} /></td>
                  </tr>
                ))}
                {driverStats.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No driver records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          FLEET TAB
      ════════════════════════════════════════════════════════ */}
      {activeTab === "fleet" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={BikeIcon}       label="Total Bikes"       value={bikes.length}                                 sub="in fleet"                  tone="brand"   />
            <KpiCard icon={CheckCircle2}   label="Operational"       value={kpi.bikesGood}                                sub="good condition"            tone="emerald" />
            <KpiCard icon={AlertTriangle}  label="Need Attention"    value={kpi.bikesIssue}                               sub="maintenance or defective"  tone="rose"    />
            <KpiCard icon={Users}          label="Assigned"          value={bikes.filter((b) => b.driverId).length}       sub="bikes with drivers"        tone="amber"   />
          </div>

          <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Bike Status Report</h3>
                <p className="text-xs text-slate-400">{bikes.length} bikes total</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bikes.map((bike) => {
                const driver = bike.driverId ? drivers.find((d) => d.id === bike.driverId) : undefined;
                const garage = bike.garageId ? garages.find((g) => g.id === bike.garageId) : undefined;
                return (
                  <div key={bike.id} className={cn(
                    "rounded-xl p-4 ring-1 transition-all",
                    bike.status === "good" ? "bg-emerald-50/60 ring-emerald-100"
                    : bike.status === "maintenance" ? "bg-amber-50/60 ring-amber-100"
                    : "bg-rose-50/60 ring-rose-100"
                  )}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-surface-900">{bike.plateNumber}</p>
                        <p className="text-xs text-slate-500 capitalize">{bike.bikeType.replace("_"," ")} · {bike.color}</p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                        bike.status === "good" ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                        : bike.status === "maintenance" ? "bg-amber-100 text-amber-700 ring-amber-200"
                        : "bg-rose-100 text-rose-700 ring-rose-200"
                      )}>
                        {bike.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-500">
                      {driver ? (
                        <p className="flex items-center gap-1.5"><Users className="h-3 w-3 text-brand-500" /> {driver.name}</p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-slate-400"><Users className="h-3 w-3" /> Unassigned</p>
                      )}
                      {garage && <p className="flex items-center gap-1.5"><Warehouse className="h-3 w-3 text-amber-500" /> {garage.name}</p>}
                      {bike.defectDescription && (
                        <p className="flex items-center gap-1.5 text-rose-600"><AlertTriangle className="h-3 w-3" /> {bike.defectDescription}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {bikes.length === 0 && <p className="col-span-3 py-10 text-center text-sm text-slate-400">No bikes in fleet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          GARAGES TAB
      ════════════════════════════════════════════════════════ */}
      {activeTab === "garages" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard icon={Warehouse} label="Total Garages"     value={garages.length}                              sub="in network"          tone="sky"   />
            <KpiCard icon={Users}     label="Total Drivers"     value={drivers.length}                              sub="fleet riders"        tone="brand" />
            <KpiCard icon={BikeIcon}  label="Total Capacity"    value={garages.reduce((s,g)=>s+g.capacity,0)}       sub="combined slots"      tone="amber" />
          </div>

          <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
            <div className="mb-5">
              <h3 className="text-base font-bold text-surface-900">Garage Performance</h3>
              <p className="text-xs text-slate-400">Breakdown per location</p>
            </div>
            <div className="space-y-4">
              {garageStats.map((g) => {
                const maxOrders = Math.max(...garageStats.map((x) => x.orders), 1);
                return (
                  <div key={g.id} className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-base font-bold text-surface-900">{g.name}</h4>
                        <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Calendar className="h-3 w-3" /> {g.location}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200">
                          {g.driverCount} drivers
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                          {g.bikeCount} bikes
                        </span>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200">
                          {g.capacity} capacity
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Orders</span>
                          <span className="font-bold text-surface-900">{g.orders}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(g.orders / maxOrders) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Avg. Rating</span>
                          <span className="font-bold text-surface-900">{g.rating > 0 ? g.rating.toFixed(1) : "—"}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(g.rating / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {garageStats.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No garages found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer summary ─────────────────────────────────── */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-4 ring-1 ring-white/60">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText className="h-4 w-4" />
          <span>Report generated for <span className="font-semibold text-surface-700">{user?.name ?? "—"}</span></span>
          <span>·</span>
          <span>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <span className="rounded-full bg-surface-100 px-3 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-surface-200">
          {filteredRecords.length} records · {period === "all" ? "All time" : period === "7d" ? "Last 7 days" : "Last 30 days"}
        </span>
      </div>

    </div>
  );
}
