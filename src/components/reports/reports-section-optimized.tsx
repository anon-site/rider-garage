"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  TrendingUp, Package, Star, Clock, Users,
  Bike as BikeIcon, Warehouse, Calendar, Download,
  ChevronDown, ChevronUp, Filter, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Minus,
  FileText, Activity, ShieldOff, FileSpreadsheet, Loader2,
  X, ChevronLeft, ChevronRight, Search, MapPin, Timer,
} from "lucide-react";
import { exportPDF, exportExcel } from "@/lib/export-utils";
import { useAttendance } from "@/contexts/attendance-context";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useGarages, useDeliveryCategories } from "@/contexts/control-panel-context";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { MonthNavigation } from "@/components/ui/month-navigation";

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
function fmtDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/* ── types ── */
type Period = "7d" | "30d" | "all" | "current-month" | "custom";
type ReportRange = { start: Date; end: Date };

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

function KpiCard({ icon: Icon, label, value, sub, trend, tone = "brand", loading = false }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; trend?: { val: number; label: string }; tone?: Tone; loading?: boolean;
}) {
  const t = toneMap[tone];
  return (
    <div className="glass-panel relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 ring-1 ring-white/60">
      <div className={`pointer-events-none absolute -right-4 sm:-right-6 -top-4 sm:-top-6 h-20 sm:h-24 w-20 sm:w-24 rounded-full bg-gradient-to-br ${t.grad} blur-2xl`} />
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest text-slate-400 truncate">{label}</p>
          <p className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                <span className="text-slate-400">Loading...</span>
              </div>
            ) : (
              value
            )}
          </p>
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
function MiniBarChart({ data, color = "from-brand-400 to-brand-600", loading = false }: {
  data: { label: string; shortLabel?: string; fullDate?: string; value: number }[];
  color?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 bg-surface-50 rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-end gap-1.5 sm:gap-2.5 h-28 pt-6 min-w-[300px] md:min-w-full">
        {data.map((d) => (
          <div key={d.label} className="group relative flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
            {/* Tooltip on hover */}
            <div className="absolute -top-3 opacity-0 scale-95 group-hover:-top-6 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none bg-surface-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl z-15 whitespace-nowrap border border-white/10">
              <p className="text-slate-300 text-[9px] font-medium leading-none">{d.fullDate || d.label}</p>
              <p className="mt-0.5 text-white text-xs font-bold leading-none">{d.value} orders</p>
            </div>
            {/* Bar */}
            <div 
              className={cn(
                "w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80",
                d.value > 0 ? `bg-gradient-to-t ${color}` : "bg-slate-200"
              )}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            {/* Label */}
            <span className="text-[10px] font-medium text-slate-600 leading-none">
              {d.shortLabel || d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Reports Section (Optimized) ─────────────────────────────────── */
export function ReportsSectionOptimized() {
  const { records, currentMonth, loadMonth, loading: attendanceLoading } = useAttendance();
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { garages } = useGarages();
  const { deliveryCategories } = useDeliveryCategories();
  const { user } = useAuth();

  const isGarageManager = user?.role === "garage" && user.garageId;
  const managedGarage = isGarageManager ? garages.find((g) => g.id === user.garageId) : null;

  // State for month navigation
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Load different month data
  const loadReportMonth = useCallback(async (year: number, month: number) => {
    if (year === currentMonth.year && month === currentMonth.month) {
      // Already loaded
      setReportMonth({ year, month });
      return;
    }
    
    setLoadingMonth(true);
    try {
      await loadMonth(year, month);
      setReportMonth({ year, month });
    } catch (error) {
      console.error('Error loading report month:', error);
    } finally {
      setLoadingMonth(false);
    }
  }, [currentMonth, loadMonth]);

  // Filter data based on user role and garage
  const filteredDrivers = useMemo(() => {
    if (isGarageManager && managedGarage) {
      return drivers.filter((d) => d.garageId === managedGarage.id);
    }
    return drivers;
  }, [drivers, isGarageManager, managedGarage]);

  const filteredBikes = useMemo(() => {
    if (isGarageManager && managedGarage) {
      return bikes.filter((b) => b.garageId === managedGarage.id);
    }
    return bikes;
  }, [bikes, isGarageManager, managedGarage]);

  // Filter records for current report month
  const monthlyRecords = useMemo(() => {
    return records.filter((r) => {
      const recordDate = new Date(r.clockIn);
      return recordDate.getFullYear() === reportMonth.year && 
             recordDate.getMonth() + 1 === reportMonth.month;
    });
  }, [records, reportMonth]);

  // Period selection
  const [period, setPeriod] = useState<Period>("current-month");
  const [sortBy, setSortBy] = useState<"orders" | "rating" | "hours">("orders");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Search states
  const [driverQuery, setDriverQuery] = useState("");
  const [fleetQuery, setFleetQuery] = useState("");
  const [garageQuery, setGarageQuery] = useState("");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter records by period (only current month data is loaded)
  const filteredRecords = useMemo(() => {
    // For optimized version, we only work with current month data
    if (period === "current-month") return monthlyRecords;
    
    // For other periods, we'd need to load additional data
    // For now, limit to current month for performance
    return monthlyRecords;
  }, [monthlyRecords, period]);

  // Optimized KPI calculations with loading states
  const kpi = useMemo(() => {
    if (attendanceLoading || loadingMonth) {
      return {
        totalOrders: 0, totalHours: 0, avgRating: 0, activeSessions: 0,
        bikesGood: 0, bikesIssue: 0, uniqueDrivers: 0, totalSessions: 0
      };
    }

    const totalOrders = filteredRecords.reduce((s, r) => s + (r.ordersDelivered ?? 0), 0);
    const totalHours  = filteredRecords.reduce((s, r) => s + calcHours(r.clockIn, r.clockOut), 0);
    const avgRating   = filteredRecords.length > 0
      ? filteredRecords.reduce((s, r) => s + r.rating, 0) / filteredRecords.length : 0;
    const activeSessions = filteredRecords.filter((r) => !r.clockOut).length;
    const bikesGood   = filteredBikes.filter((b) => b.status === "good").length;
    const bikesIssue  = filteredBikes.filter((b) => b.status !== "good").length;
    const uniqueDrivers = new Set(filteredRecords.map((r) => r.driverId)).size;
    
    return { 
      totalOrders, totalHours, avgRating, activeSessions, 
      bikesGood, bikesIssue, uniqueDrivers, totalSessions: filteredRecords.length 
    };
  }, [filteredRecords, filteredBikes, attendanceLoading, loadingMonth]);

  // Optimized driver stats
  const driverStats = useMemo(() => {
    if (attendanceLoading || loadingMonth) return [];

    return filteredDrivers.map((d) => {
      const dRec = filteredRecords.filter((r) => r.driverId === d.id);
      const orders = dRec.reduce((s, r) => s + r.ordersDelivered, 0);
      const hours  = dRec.reduce((s, r) => s + calcHours(r.clockIn, r.clockOut), 0);
      const rating = dRec.length > 0 ? dRec.reduce((s, r) => s + r.rating, 0) / dRec.length : 0;
      const bike   = d.bikeId ? filteredBikes.find((b) => b.id === d.bikeId) : undefined;
      const isActive = filteredRecords.some((r) => r.driverId === d.id && !r.clockOut);
      return { ...d, orders, hours, rating, sessions: dRec.length, bike, isActive };
    }).sort((a, b) => {
      const key = sortBy;
      const diff = b[key] - a[key];
      return sortDir === "desc" ? diff : -diff;
    });
  }, [filteredDrivers, filteredRecords, filteredBikes, sortBy, sortDir, attendanceLoading, loadingMonth]);

  const filteredDriverStats = useMemo(() => {
    const q = driverQuery.trim().toLowerCase();
    if (!q) return driverStats;
    return driverStats.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q)
    );
  }, [driverStats, driverQuery]);

  // Optimized daily trend (limited to current month)
  const dailyTrend = useMemo(() => {
    if (attendanceLoading || loadingMonth) return [];

    const daysInMonth = new Date(reportMonth.year, reportMonth.month, 0).getDate();
    const days = Math.min(daysInMonth, 30); // Limit to 30 days for performance
    
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(reportMonth.year, reportMonth.month - 1, i + 1);
      const key = d.toISOString().slice(0, 10);
      const dayRec = filteredRecords.filter((r) => r.clockIn.slice(0, 10) === key);
      return {
        label: fmtShortDate(d.toISOString()),
        shortLabel: String(d.getDate()),
        fullDate: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }),
        value: dayRec.reduce((s, r) => s + r.ordersDelivered, 0)
      };
    });
  }, [filteredRecords, reportMonth, attendanceLoading, loadingMonth]);

  // Export handler
  async function handleExport(type: "pdf" | "excel") {
    setExportOpen(false);
    setExporting(type);
    const driverMap = Object.fromEntries(filteredDrivers.map((d) => [d.id, d.name]));
    const garageMap = Object.fromEntries(garages.map((g) => [g.id, g.name]));
    const deliveryCategoryMap = Object.fromEntries(deliveryCategories.map((c) => [c.id, c.name]));
    
    const exportData = {
      driverStats: filteredDriverStats,
      bikes: filteredBikes,
      filteredRecords,
      driverMap,
      garageMap,
      deliveryCategoryMap,
      reportPeriod: `${reportMonth.year}-${reportMonth.month.toString().padStart(2, '0')}`
    };

    try {
      if (type === "pdf") await exportPDF(exportData, period);
      else await exportExcel(exportData, period);
    } finally {
      setExporting(null);
    }
  }

  // Access guard
  if (!user || (!["admin", "supervisor", "observer"].includes(user.role) && !isGarageManager)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <ShieldOff className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-slate-500">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports</h1>
          <p className="text-sm text-slate-600">
            Performance analytics and insights
            {isGarageManager && managedGarage && ` - ${managedGarage.name}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <MonthNavigation
            currentMonth={reportMonth}
            onMonthChange={loadReportMonth}
            loading={loadingMonth}
          />
          
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={!!exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
            >
              {exporting === "pdf" || exporting === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5">
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={!!exporting}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  disabled={!!exporting}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Period:</span>
        {[
          { key: "current-month", label: "Current Month" },
          { key: "7d", label: "Last 7 Days" },
          { key: "30d", label: "Last 30 Days" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key as Period)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              period === key
                ? "bg-brand-100 text-brand-700 ring-1 ring-brand-200"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Package}
          label="Total Orders"
          value={kpi.totalOrders.toLocaleString()}
          sub={`${kpi.totalSessions} sessions`}
          tone="brand"
          loading={attendanceLoading || loadingMonth}
        />
        <KpiCard
          icon={Clock}
          label="Total Hours"
          value={fmtHours(kpi.totalHours)}
          sub={`${kpi.uniqueDrivers} drivers`}
          tone="emerald"
          loading={attendanceLoading || loadingMonth}
        />
        <KpiCard
          icon={Star}
          label="Avg Rating"
          value={kpi.avgRating.toFixed(1)}
          sub={`${kpi.activeSessions} active`}
          tone="amber"
          loading={attendanceLoading || loadingMonth}
        />
        <KpiCard
          icon={BikeIcon}
          label="Fleet Status"
          value={`${kpi.bikesGood}/${kpi.bikesGood + kpi.bikesIssue}`}
          sub={`${kpi.bikesIssue} need attention`}
          tone={kpi.bikesIssue > 0 ? "rose" : "sky"}
          loading={attendanceLoading || loadingMonth}
        />
      </div>

      {/* Orders Trend Chart */}
      <div className="glass-panel rounded-xl p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-surface-900">Orders Trend</h3>
          <p className="text-sm text-slate-600">Daily order volume</p>
        </div>
        <MiniBarChart data={dailyTrend} loading={attendanceLoading || loadingMonth} />
      </div>

      {/* Driver Performance Table */}
      <div className="glass-panel rounded-xl p-4 sm:p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Driver Performance</h3>
            <p className="text-sm text-slate-600">Individual metrics and rankings</p>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={driverQuery}
              onChange={(e) => setDriverQuery(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 pr-4 font-medium text-slate-700">Driver</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700 cursor-pointer" onClick={() => { setSortBy("orders"); setSortDir(sortDir === "desc" ? "asc" : "desc"); }}>
                  Orders {sortBy === "orders" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-700 cursor-pointer" onClick={() => { setSortBy("hours"); setSortDir(sortDir === "desc" ? "asc" : "desc"); }}>
                  Hours {sortBy === "hours" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-700 cursor-pointer" onClick={() => { setSortBy("rating"); setSortDir(sortDir === "desc" ? "asc" : "desc"); }}>
                  Rating {sortBy === "rating" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-center py-3 pl-4 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDriverStats.slice(0, 10).map((driver) => (
                <tr key={driver.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div>
                      <div className="font-medium text-surface-900">{driver.name}</div>
                      <div className="text-xs text-slate-500">{driver.phone}</div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-medium">{driver.orders.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{fmtHours(driver.hours)}</td>
                  <td className="text-right py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      driver.rating >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      <Star className="h-3 w-3 fill-current" />
                      {driver.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-3 pl-4">
                    {driver.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        <Activity className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
