"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Users,
  Bike as BikeIcon,
  Warehouse,
  Star,
  CheckCircle2,
  MapPin,
  Package,
  BarChart3,
  Activity,
  Crown,
  Eye,
  Loader2,
} from "lucide-react";
import { useUsers, useGarages, useDeliveryCategories } from "@/contexts/control-panel-context";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useAttendance } from "@/contexts/attendance-context";
import { useAuth } from "@/contexts/auth-context";
import { ROLES } from "@/types/user";
import { cn } from "@/lib/utils";
import { DeliveryCategoriesTab } from "./delivery-categories-tab";
import { MonthNavigation } from "@/components/ui/month-navigation";

/* ── helpers ── */
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


/* ── stat card ── */
type Tone = "brand" | "emerald" | "amber" | "rose" | "violet" | "sky";

const toneCfg: Record<
  Tone,
  { grad: string; icon: string; ring: string; badge: string }
> = {
  brand: {
    grad: "from-brand-500/20 to-brand-500/5",
    icon: "from-brand-500 to-brand-600 text-white",
    ring: "ring-brand-200",
    badge: "bg-brand-50 text-brand-700 ring-brand-200",
  },
  emerald: {
    grad: "from-emerald-500/20 to-emerald-500/5",
    icon: "from-emerald-500 to-emerald-600 text-white",
    ring: "ring-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  amber: {
    grad: "from-amber-500/20 to-amber-500/5",
    icon: "from-amber-400 to-amber-600 text-white",
    ring: "ring-amber-200",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  rose: {
    grad: "from-rose-500/20 to-rose-500/5",
    icon: "from-rose-500 to-rose-600 text-white",
    ring: "ring-rose-200",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  violet: {
    grad: "from-violet-500/20 to-violet-500/5",
    icon: "from-violet-500 to-violet-600 text-white",
    ring: "ring-violet-200",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  sky: {
    grad: "from-sky-500/20 to-sky-500/5",
    icon: "from-sky-400 to-sky-600 text-white",
    ring: "ring-sky-200",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "brand",
  loading = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  loading?: boolean;
}) {
  const cfg = toneCfg[tone];
  return (
    <div className="glass-panel relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 ring-1 ring-white/60">
      <div
        className={`pointer-events-none absolute -right-4 sm:-right-6 -top-4 sm:-top-6 h-20 sm:h-24 w-20 sm:w-24 rounded-full bg-gradient-to-br ${cfg.grad} blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest text-slate-400 truncate">
            {label}
          </p>
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
          {sub && (
            <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs text-slate-500">
              {sub}
            </p>
          )}
        </div>
        <span
          className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br shadow-lg ${cfg.icon}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

/* ── role badge ── */
function RoleBadge({ role }: { role: string }) {
  const cfg = {
    admin: { cls: "bg-rose-100 text-rose-700 ring-rose-200", label: "Admin", icon: Crown },
    supervisor: { cls: "bg-violet-100 text-violet-700 ring-violet-200", label: "Supervisor", icon: Eye },
    observer: { cls: "bg-sky-100 text-sky-700 ring-sky-200", label: "Observer", icon: Eye },
    garage: { cls: "bg-emerald-100 text-emerald-700 ring-emerald-200", label: "Manager", icon: Warehouse },
  }[role] || { cls: "bg-slate-100 text-slate-700 ring-slate-200", label: role, icon: Users };
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
        cfg.cls
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

/* ── star rating ── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          )}
          strokeWidth={1}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-500">{rating}/5</span>
    </span>
  );
}


/* ══════════════════════════════════════════════════
   MAIN COMPONENT (OPTIMIZED)
══════════════════════════════════════════════════ */
export function CpDashboardOptimized() {
  const { users } = useUsers();
  const { garages: garageList } = useGarages();
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { records, currentMonth, loadMonth, loading: attendanceLoading } = useAttendance();
  const { user } = useAuth();
  const { deliveryCategories } = useDeliveryCategories();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDeliveryCategoryId, setSelectedDeliveryCategoryId] = useState<string | null>(null);
  const [showAllDrivers, setShowAllDrivers] = useState(false);

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

  // Hide garages section for garage managers
  const isGarageManager = user?.role === "garage";

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "delivery-categories", label: "Delivery Categories", icon: Package },
  ];

  /* ── Filter data for garage managers ── */
  const filteredDrivers = useMemo(() => 
    isGarageManager && user?.garageId 
      ? drivers.filter((d) => d.garageId === user.garageId)
      : drivers,
    [drivers, isGarageManager, user?.garageId]
  );
  
  const filteredBikes = useMemo(() => 
    isGarageManager && user?.garageId 
      ? bikes.filter((b) => b.garageId === user.garageId)
      : bikes,
    [bikes, isGarageManager, user?.garageId]
  );

  // Filter records for current report month
  const monthlyRecords = useMemo(() => {
    return records.filter((r) => {
      const recordDate = new Date(r.clockIn);
      return recordDate.getFullYear() === reportMonth.year && 
             recordDate.getMonth() + 1 === reportMonth.month;
    });
  }, [records, reportMonth]);
  
  // Apply delivery category filter to drivers and records
  const categoryFilteredDrivers = useMemo(() => {
    if (!selectedDeliveryCategoryId) return filteredDrivers;
    return filteredDrivers.filter(d => d.deliveryCategoryIds?.includes(selectedDeliveryCategoryId));
  }, [filteredDrivers, selectedDeliveryCategoryId]);

  const categoryFilteredRecords = useMemo(() => {
    const categoryFilteredDriverIds = new Set(categoryFilteredDrivers.map(d => d.id));
    return monthlyRecords.filter((r) => categoryFilteredDriverIds.has(r.driverId));
  }, [monthlyRecords, categoryFilteredDrivers]);

  /* ── computed stats (OPTIMIZED) ── */
  const stats = useMemo(() => {
    if (attendanceLoading || loadingMonth) {
      return {
        totalUsers: isGarageManager ? 1 : users.length,
        totalDrivers: 0,
        activeDrivers: 0,
        totalGarages: isGarageManager ? 1 : garageList.length,
        totalCapacity: 0,
        totalBikes: 0,
        bikesGood: 0,
        bikesIssue: 0,
        totalOrders: 0,
        avgRating: "0.0",
        totalHours: "0h 0m",
        totalSessions: 0,
        roleCount: isGarageManager ? { garage: 1 } : {},
      };
    }

    const activeDrivers = categoryFilteredDrivers.filter((d) =>
      categoryFilteredRecords.some((r) => r.driverId === d.id && r.clockIn && !r.clockOut)
    );
    const totalOrders = categoryFilteredRecords.reduce((s, r) => s + (r.ordersDelivered ?? 0), 0);
    const avgRating =
      categoryFilteredRecords.length > 0
        ? categoryFilteredRecords.reduce((s, r) => s + r.rating, 0) / categoryFilteredRecords.length
        : 0;
    const totalHours = categoryFilteredRecords.reduce(
      (s, r) => s + calcHours(r.clockIn, r.clockOut),
      0
    );
    const totalCapacity = isGarageManager && user?.garageId
      ? garageList.find(g => g.id === user.garageId)?.capacity ?? 0
      : garageList.reduce((s, g) => s + g.capacity, 0);
    const bikesGood = filteredBikes.filter((b) => b.status === "good").length;
    const bikesIssue = filteredBikes.filter((b) => b.status !== "good").length;

    const roleCount = ROLES.reduce(
      (acc, r) => {
        acc[r.id] = users.filter((u) => u.role === r.id).length;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalUsers: isGarageManager ? 1 : users.length,
      totalDrivers: categoryFilteredDrivers.length,
      activeDrivers: activeDrivers.length,
      totalGarages: isGarageManager ? 1 : garageList.length,
      totalCapacity,
      totalBikes: filteredBikes.length,
      bikesGood,
      bikesIssue,
      totalOrders,
      avgRating: avgRating.toFixed(1),
      totalHours: fmtHours(totalHours),
      totalSessions: categoryFilteredRecords.length,
      roleCount: isGarageManager ? { garage: 1 } : roleCount,
    };
  }, [users, garageList, filteredBikes, categoryFilteredDrivers, categoryFilteredRecords, isGarageManager, user?.garageId, attendanceLoading, loadingMonth]);

  /* ── per-driver attendance summary (OPTIMIZED) ── */
  const driverSummaries = useMemo(() => {
    if (attendanceLoading || loadingMonth) return [];

    return categoryFilteredDrivers.map((d) => {
      const dRecords = categoryFilteredRecords
        .filter((r) => r.driverId === d.id)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
      const totalOrders = dRecords.reduce((s, r) => s + r.ordersDelivered, 0);
      const avgRating =
        dRecords.length > 0
          ? dRecords.reduce((s, r) => s + r.rating, 0) / dRecords.length
          : 0;
      const totalHours = dRecords.reduce(
        (s, r) => s + calcHours(r.clockIn, r.clockOut),
        0
      );
      const isActive = dRecords.some((r) => r.clockIn && !r.clockOut);
      const assignedBike = d.bikeId ? filteredBikes.find((b) => b.id === d.bikeId) : undefined;
      return { ...d, dRecords, totalOrders, avgRating, totalHours, isActive, assignedBike };
    });
  }, [categoryFilteredDrivers, categoryFilteredRecords, filteredBikes, attendanceLoading, loadingMonth]);

  // Limit driver summaries for performance
  const displayedDriverSummaries = driverSummaries.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-surface-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "delivery-categories" ? (
        <DeliveryCategoriesTab />
      ) : (
        <div className="space-y-6">
          {/* ── Header Section with Title and Month Navigation ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-surface-900">System Overview</h2>
              <p className="text-sm text-slate-500 mt-1">
                Real-time metrics and fleet status
                {isGarageManager && ` - ${garageList.find(g => g.id === user?.garageId)?.name}`}
              </p>
            </div>
            
            {/* Month Navigation */}
            <MonthNavigation
              currentMonth={reportMonth}
              onMonthChange={loadReportMonth}
              loading={loadingMonth}
            />
          </div>
          
          {/* Delivery Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Filter by:</span>
            <button
              type="button"
              onClick={() => setSelectedDeliveryCategoryId(null)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedDeliveryCategoryId
                  ? "bg-brand-100 text-brand-700 ring-2 ring-brand-200"
                  : "bg-surface-100 text-slate-600 ring-1 ring-surface-200 hover:bg-surface-200"
              }`}
            >
              All
            </button>
            {deliveryCategories
              .filter(cat => cat.isActive !== false)
              .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedDeliveryCategoryId(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedDeliveryCategoryId === cat.id
                      ? "bg-brand-100 text-brand-700 ring-2 ring-brand-200"
                      : "bg-surface-100 text-slate-600 ring-1 ring-surface-200 hover:bg-surface-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats.totalUsers}
              sub={`${Object.values(stats.roleCount).reduce((s, c) => s + c, 0)} roles`}
              tone="brand"
              loading={attendanceLoading || loadingMonth}
            />
            <StatCard
              icon={Users}
              label="Total Drivers"
              value={stats.totalDrivers}
              sub={`${stats.activeDrivers} active`}
              tone="emerald"
              loading={attendanceLoading || loadingMonth}
            />
            <StatCard
              icon={BikeIcon}
              label="Total Bikes"
              value={stats.totalBikes}
              sub={`${stats.bikesIssue} need attention`}
              tone={stats.bikesIssue > 0 ? "rose" : "sky"}
              loading={attendanceLoading || loadingMonth}
            />
            <StatCard
              icon={Package}
              label="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              sub={`${stats.totalHours} worked`}
              tone="amber"
              loading={attendanceLoading || loadingMonth}
            />
          </div>

          {/* ── System Users Section ── */}
          {!isGarageManager && (
            <div className="glass-panel rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-surface-900">System Users</h3>
                <p className="text-sm text-slate-600">User distribution by role</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2">
                      <RoleBadge role={role.id} />
                    </div>
                    <span className="text-lg font-bold text-surface-900">
                      {stats.roleCount[role.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Garage Network Section ── */}
          {!isGarageManager && (
            <div className="glass-panel rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-surface-900">Garage Network</h3>
                <p className="text-sm text-slate-600">Fleet capacity and utilization</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {garageList.map((garage) => {
                  const garageDrivers = filteredDrivers.filter((d) => d.garageId === garage.id);
                  const garageBikes = filteredBikes.filter((b) => b.garageId === garage.id);
                  const utilization = garage.capacity > 0 ? (garageDrivers.length / garage.capacity) * 100 : 0;
                  
                  return (
                    <div key={garage.id} className="rounded-lg border border-surface-200 bg-white p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-surface-900">{garage.name}</h4>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {garage.location}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          {garageDrivers.length}/{garage.capacity}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Utilization</span>
                          <span className="font-medium text-surface-900">{utilization.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-surface-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              utilization > 90 ? "bg-rose-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-600">{garageDrivers.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BikeIcon className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-600">{garageBikes.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Driver Performance Summary ── */}
          <div className="glass-panel rounded-xl p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Driver Performance</h3>
                <p className="text-sm text-slate-600">Monthly driver metrics (Top 10)</p>
              </div>
              <button
                onClick={() => setShowAllDrivers(!showAllDrivers)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {showAllDrivers ? 'Show Less' : 'Show All'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {(showAllDrivers ? driverSummaries : displayedDriverSummaries).map((driver) => (
                <div key={driver.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-3 hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold text-sm">
                      {driver.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-surface-900 truncate">{driver.name}</div>
                      <div className="text-sm text-slate-600">{driver.phone}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-medium text-surface-900">{driver.totalOrders}</div>
                      <div className="text-slate-500">orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-surface-900">{fmtHours(driver.totalHours)}</div>
                      <div className="text-slate-500">hours</div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={Math.round(driver.avgRating)} />
                    </div>
                    <div>
                      {driver.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <Activity className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {driverSummaries.length > 10 && !showAllDrivers && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllDrivers(true)}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Show {driverSummaries.length - 10} more drivers...
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
