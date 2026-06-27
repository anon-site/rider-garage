"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Bike as BikeIcon,
  Warehouse,
  ShieldCheck,
  TrendingUp,
  Clock,
  Star,
  UserCheck,
  UserX,
  MapPin,
  Package,
  BarChart3,
  Activity,
  Crown,
  Eye,
} from "lucide-react";
import { useUsers, useGarages, useDeliveryCategories } from "@/contexts/control-panel-context";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useAttendance } from "@/contexts/attendance-context";
import { useAuth } from "@/contexts/auth-context";
import { ROLES } from "@/types/user";
import { cn } from "@/lib/utils";
import { DeliveryCategoriesTab } from "./delivery-categories-tab";

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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  tone?: Tone;
}) {
  const t = toneCfg[tone];
  return (
    <div className="glass-panel relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 ring-1 ring-white/60">
      <div
        className={`pointer-events-none absolute -right-4 sm:-right-6 -top-4 sm:-top-6 h-20 sm:h-24 w-20 sm:w-24 rounded-full bg-gradient-to-br ${t.grad} blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest text-slate-400 truncate">
            {label}
          </p>
          <p className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs text-slate-500">{sub}</p>
          )}
        </div>
        <span
          className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br shadow-lg ${t.icon}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

/* ── section title ── */
function SectionTitle({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string | number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <h3 className="text-base font-bold text-surface-900">{title}</h3>
      {badge !== undefined && (
        <span className="ml-1 rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-surface-200">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ── role badge ── */
const roleCfg = {
  admin: { label: "Admin", cls: "bg-rose-50 text-rose-700 ring-rose-200", icon: Crown },
  supervisor: { label: "Supervisor", cls: "bg-violet-50 text-violet-700 ring-violet-200", icon: ShieldCheck },
  garage: { label: "Manager", cls: "bg-brand-50 text-brand-700 ring-brand-200", icon: Warehouse },
  observer: { label: "Observer", cls: "bg-sky-50 text-sky-700 ring-sky-200", icon: Eye },
};

function RoleBadge({ role }: { role: keyof typeof roleCfg }) {
  const cfg = roleCfg[role];
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

/* ── star rating (0-100 scale) ── */
function StarRating({ rating }: { rating: number }) {
  const stars = Math.min(5, Math.max(0, Math.round(rating / 20)));
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          )}
          strokeWidth={1}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-500">{rating > 0 ? rating : "—"}</span>
    </span>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export function CpDashboard() {
  const { users } = useUsers();
  const { garages: garageList } = useGarages();
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { records } = useAttendance();
  const { user } = useAuth();
  const { deliveryCategories } = useDeliveryCategories();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDeliveryCategoryId, setSelectedDeliveryCategoryId] = useState<string | null>(null);
  const [showAllDrivers, setShowAllDrivers] = useState(false);

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
  
  // Apply delivery category filter to drivers and records
  const categoryFilteredDrivers = useMemo(() => {
    if (!selectedDeliveryCategoryId) return filteredDrivers;
    return filteredDrivers.filter(d => d.deliveryCategoryIds?.includes(selectedDeliveryCategoryId));
  }, [filteredDrivers, selectedDeliveryCategoryId]);

  const categoryFilteredRecords = useMemo(() => {
    const categoryFilteredDriverIds = new Set(categoryFilteredDrivers.map(d => d.id));
    return records.filter((r) => categoryFilteredDriverIds.has(r.driverId));
  }, [records, categoryFilteredDrivers]);

  /* ── computed stats ── */
  const stats = useMemo(() => {
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
      totalUsers: isGarageManager ? 1 : users.length, // Garage manager sees only themselves
      totalDrivers: categoryFilteredDrivers.length,
      activeDrivers: activeDrivers.length,
      totalGarages: isGarageManager ? 1 : garageList.length, // Garage manager sees only their garage
      totalCapacity,
      totalBikes: filteredBikes.length,
      bikesGood,
      bikesIssue,
      totalOrders,
      avgRating: avgRating.toFixed(1),
      totalHours: fmtHours(totalHours),
      totalSessions: categoryFilteredRecords.length,
      roleCount: isGarageManager ? { garage: 1 } : roleCount, // Garage manager sees only garage role
    };
  }, [users, garageList, filteredBikes, categoryFilteredDrivers, categoryFilteredRecords, isGarageManager, user?.garageId]);

  /* ── per-driver attendance summary ── */
  const driverSummaries = useMemo(() => {
    return categoryFilteredDrivers
      .map((d) => {
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
        const sessions = dRecords.filter((r) => r.clockOut).length;
        const isActive = dRecords.some((r) => r.clockIn && !r.clockOut);
        const assignedBike = d.bikeId ? filteredBikes.find((b) => b.id === d.bikeId) : undefined;
        return { ...d, dRecords, totalOrders, avgRating, totalHours, sessions, isActive, assignedBike };
      })
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [categoryFilteredDrivers, categoryFilteredRecords, filteredBikes]);

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
          {/* ── Header Section with Title and Filter ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-surface-900">System Overview</h2>
              <p className="text-sm text-slate-500 mt-1">Real-time metrics and fleet status</p>
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
                .map((category) => {
                  const count = categoryFilteredDrivers.filter(d => d.deliveryCategoryIds?.includes(category.id)).length;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedDeliveryCategoryId(category.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedDeliveryCategoryId === category.id
                          ? "bg-brand-100 text-brand-700 ring-2 ring-brand-200"
                          : "bg-surface-100 text-slate-600 ring-1 ring-surface-200 hover:bg-surface-200"
                      }`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ── Primary KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={UserCheck} label="Active Drivers" value={stats.activeDrivers} sub={`${stats.totalDrivers} total`} tone="emerald" />
            <StatCard icon={BikeIcon} label="Fleet Bikes" value={stats.totalBikes} sub={`${stats.bikesGood} good · ${stats.bikesIssue} issue`} tone={stats.bikesIssue > 0 ? "amber" : "emerald"} />
            <StatCard icon={Package} label="Total Orders" value={stats.totalOrders} sub={`${stats.totalSessions} sessions`} tone="violet" />
            <StatCard icon={Star} label="Avg. Rating" value={stats.avgRating} sub="performance score" tone="amber" />
          </div>

          {/* ── Secondary Metrics Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Users} label="System Users" value={stats.totalUsers} sub={`${stats.roleCount["admin"] ?? 0} admins`} tone="brand" />
            <StatCard icon={Warehouse} label="Garages" value={stats.totalGarages} sub={`${stats.totalCapacity} capacity`} tone="sky" />
            <StatCard icon={Clock} label="Total Hours" value={stats.totalHours} sub="work time logged" tone="sky" />
            <StatCard icon={Activity} label="On Shift" value={stats.activeDrivers} sub="currently active" tone={stats.activeDrivers > 0 ? "emerald" : "rose"} />
          </div>

          {/* ── Main Content Grid ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Users breakdown */}
            <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/60 shadow-lg shadow-surface-900/5">
              <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-3">
                <SectionTitle icon={Users} title="System Users" badge={isGarageManager ? 1 : users.length} />
                <span className="text-xs text-slate-400 font-medium">Roles distribution</span>
              </div>
              
              <div className="max-h-[320px] overflow-y-auto pr-1.5 space-y-2.5 scrollbar-none">
                {(isGarageManager && user ? [user] : users).map((u) => {
                  const garage = u.garageId ? garageList.find((g) => g.id === u.garageId) : undefined;
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-lg border border-surface-150 bg-white/70 hover:bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-200/80 group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-extrabold text-white ring-2 ring-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-surface-900 truncate leading-snug">{u.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{u.email}</p>
                        {garage && (
                          <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-surface-50 border border-surface-100 px-2 py-0.5 rounded-md w-fit">
                            <Warehouse className="h-3 w-3 text-slate-400 shrink-0" />
                            {garage.name}
                          </p>
                        )}
                      </div>
                      <RoleBadge role={u.role} />
                    </div>
                  );
                })}
              </div>

              {/* Role distribution bar */}
              <div className="mt-4 border-t border-surface-100/60 pt-3 space-y-2">
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-100 shadow-inner">
                  {ROLES.map((r, i) => {
                    const count = stats.roleCount[r.id] ?? 0;
                    const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                    const colors = ["bg-rose-400", "bg-violet-400", "bg-brand-400", "bg-sky-400"];
                    return pct > 0 ? (
                      <div
                        key={r.id}
                        className={cn(colors[i], "transition-all duration-500")}
                        style={{ width: `${pct}%` }}
                      />
                    ) : null;
                  })}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {ROLES.map((r, i) => {
                    const count = stats.roleCount[r.id] ?? 0;
                    const dotColors = ["bg-rose-400", "bg-violet-400", "bg-brand-400", "bg-sky-400"];
                    return (
                      <span key={r.id} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span className={cn("h-2 w-2 rounded-full border border-white shadow-sm shrink-0", dotColors[i])} />
                        {r.label}: <span className="font-extrabold text-surface-900">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Garages breakdown - hidden for garage managers */}
            {!isGarageManager && (
              <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/60 shadow-lg shadow-surface-900/5">
                <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-3">
                  <SectionTitle icon={Warehouse} title="Garage Network" badge={garageList.length} />
                  <span className="text-xs text-slate-400 font-medium">Capacity overview</span>
                </div>
                
                <div className="max-h-[320px] overflow-y-auto pr-1.5 space-y-2.5 scrollbar-none">
                  {garageList.map((g) => {
                    const manager = g.managerId ? users.find((u) => u.id === g.managerId) : undefined;
                    const maxCap = Math.max(...garageList.map((x) => x.capacity), 1);
                    const pct = Math.round((g.capacity / maxCap) * 100);
                    return (
                      <div
                        key={g.id}
                        className="rounded-lg border border-surface-150 bg-white/70 hover:bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-200/80 group flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-surface-900 text-sm tracking-tight leading-snug">{g.name}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                              <MapPin className="h-3 w-3 text-slate-300 shrink-0" />
                              {g.location}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-brand-50 border border-brand-100 px-2 py-0.5 text-[11px] font-extrabold text-brand-700 shadow-inner">
                            {g.capacity} slots
                          </span>
                        </div>
                        
                        <div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-100 border border-surface-100 shadow-inner">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {manager ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-brand-50/40 border border-brand-100/50 px-2 py-0.5 rounded-md w-fit">
                            <ShieldCheck className="h-3 w-3 text-brand-500 shrink-0" />
                            <span>Manager: <span className="font-bold text-surface-800">{manager.name}</span></span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50/40 border border-rose-100/50 px-2 py-0.5 rounded-md w-fit">
                            <UserX className="h-3 w-3 text-rose-400 shrink-0" />
                            <span>No manager assigned</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Driver Performance Table ── */}
          <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/60 shadow-lg shadow-surface-900/5">
            <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-3">
              <SectionTitle icon={TrendingUp} title="Driver Performance" badge={showAllDrivers ? driverSummaries.length : Math.min(15, driverSummaries.length)} />
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{showAllDrivers ? "All drivers" : "Top performers"}</span>
                <button
                  type="button"
                  onClick={() => setShowAllDrivers(!showAllDrivers)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {showAllDrivers ? "Show top 15" : "Show all"}
                </button>
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto pr-1.5 scrollbar-none">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-surface-200">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Driver</th>
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bike</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Orders</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sessions</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hours</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {(showAllDrivers ? driverSummaries : driverSummaries.slice(0, 15)).map((d) => (
                    <tr key={d.id} className="group">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-bold text-white">
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900 text-xs">{d.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {d.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {d.assignedBike ? (
                          <p className="font-medium text-surface-800 text-xs">{d.assignedBike.plateNumber}</p>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right font-bold text-surface-900 text-xs">
                        {d.totalOrders}
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-600 text-xs">
                        {d.sessions}
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-600 text-xs">
                        {fmtHours(d.totalHours)}
                      </td>
                      <td className="py-2 text-right">
                        <StarRating rating={Math.round(d.avgRating)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Live Activity Feed ── */}
          <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/60 shadow-lg shadow-surface-900/5">
            <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-3">
              <SectionTitle icon={Activity} title="Live Activity" badge={categoryFilteredRecords.filter(r => !r.clockOut && Date.now() - new Date(r.clockIn).getTime() < 7 * 86400000).length} />
              <span className="text-xs text-slate-400">Currently on shift (last 7 days)</span>
            </div>
            <div className="space-y-2.5">
              {categoryFilteredRecords
                .filter(r => !r.clockOut && Date.now() - new Date(r.clockIn).getTime() < 7 * 86400000)
                .sort((a, b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime())
                .map((r) => {
                  const driver = categoryFilteredDrivers.find((d) => d.id === r.driverId);
                  const hours = calcHours(r.clockIn, r.clockOut);
                  const clockInTime = new Date(r.clockIn);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-brand-50/60 px-4 py-3.5 ring-1 ring-emerald-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white ring-2 ring-white shadow-sm">
                          {driver?.name.charAt(0) ?? "?"}
                          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-surface-900">
                            {driver?.name ?? r.driverId}
                          </p>
                          <p className="text-[11px] text-emerald-600 font-medium">
                            Shift started at {clockInTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 ml-auto">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                          <Clock className="h-3.5 w-3.5" />
                          {fmtHours(hours)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-100 px-2.5 py-1 rounded-lg">
                          <Package className="h-3.5 w-3.5" />
                          {r.ordersDelivered}
                        </span>
                        <StarRating rating={r.rating} />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          LIVE
                        </span>
                      </div>
                    </div>
                  );
                })}
              {categoryFilteredRecords.filter(r => !r.clockOut && Date.now() - new Date(r.clockIn).getTime() < 7 * 86400000).length === 0 && (
                <div className="text-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 mx-auto mb-3">
                    <UserX className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No active shifts</p>
                  <p className="text-xs text-slate-400 mt-1">All drivers are currently offline</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Attendance Log ── */}
          <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/60 shadow-lg shadow-surface-900/5">
            <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-3">
              <SectionTitle icon={BarChart3} title="Attendance Log" badge={categoryFilteredRecords.filter(r => r.clockOut && Date.now() - new Date(r.clockIn).getTime() < 7 * 86400000).length} />
              <span className="text-xs text-slate-400">Last 7 days</span>
            </div>
            <div className="space-y-2.5">
              {[...categoryFilteredRecords]
                .filter(r => r.clockOut && Date.now() - new Date(r.clockIn).getTime() < 7 * 86400000)
                .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
                .slice(0, 8)
                .map((r) => {
                  const driver = categoryFilteredDrivers.find((d) => d.id === r.driverId);
                  const hours = calcHours(r.clockIn, r.clockOut);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-4 rounded-xl bg-surface-50/80 px-4 py-3 ring-1 ring-surface-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-xs font-bold text-white ring-2 ring-white shadow-sm">
                          {driver?.name.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-900">
                            {driver?.name ?? r.driverId}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {fmtDate(r.clockIn)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 ml-auto">
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(r.clockIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          {" → "}
                          {new Date(r.clockOut!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-violet-400" />
                          {fmtHours(hours)}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-surface-900">
                          <Package className="h-3.5 w-3.5 text-brand-500" />
                          {r.ordersDelivered}
                        </span>
                        <StarRating rating={r.rating} />
                      </div>
                    </div>
                  );
                })}
              {categoryFilteredRecords.filter(r => r.clockOut && Date.now() - new Date(r.clockIn).getTime() < 7 * 86400000).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm font-medium text-slate-500">No completed sessions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
