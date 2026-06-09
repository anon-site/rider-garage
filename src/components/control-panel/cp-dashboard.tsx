"use client";

import { useMemo } from "react";
import {
  Users,
  Bike,
  Warehouse,
  ShieldCheck,
  TrendingUp,
  Clock,
  Star,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  UserCheck,
  UserX,
  MapPin,
  Package,
  BarChart3,
  Activity,
  Crown,
  Eye,
  Settings2,
} from "lucide-react";
import { useUsers, useGarages } from "@/contexts/control-panel-context";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useAttendance } from "@/contexts/attendance-context";
import { useAuth } from "@/contexts/auth-context";
import { ROLES } from "@/types/user";
import { cn } from "@/lib/utils";

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

/* ── bike status badge ── */
const bikeStat = {
  good: { label: "Good", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  maintenance: { label: "Maintenance", cls: "bg-amber-50 text-amber-700 ring-amber-200", icon: Wrench },
  defective: { label: "Defective", cls: "bg-rose-50 text-rose-700 ring-rose-200", icon: AlertTriangle },
};

function BikeStatusBadge({ status }: { status: keyof typeof bikeStat }) {
  const cfg = bikeStat[status];
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
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export function CpDashboard() {
  const { users } = useUsers();
  const { garages: garageList } = useGarages();
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { records } = useAttendance();
  const { user } = useAuth();

  // Hide garages section for garage managers
  const isGarageManager = user?.role === "garage";

  /* ── computed stats ── */
  const stats = useMemo(() => {
    const activeDrivers = drivers.filter((d) =>
      records.some((r) => r.driverId === d.id && r.clockIn && !r.clockOut)
    );
    const totalOrders = records.reduce((s, r) => s + (r.ordersDelivered ?? 0), 0);
    const avgRating =
      records.length > 0
        ? records.reduce((s, r) => s + r.rating, 0) / records.length
        : 0;
    const totalHours = records.reduce(
      (s, r) => s + calcHours(r.clockIn, r.clockOut),
      0
    );
    const totalCapacity = garageList.reduce((s, g) => s + g.capacity, 0);
    const bikesGood = bikes.filter((b) => b.status === "good").length;
    const bikesIssue = bikes.filter((b) => b.status !== "good").length;

    const roleCount = ROLES.reduce(
      (acc, r) => {
        acc[r.id] = users.filter((u) => u.role === r.id).length;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalUsers: users.length,
      totalDrivers: drivers.length,
      activeDrivers: activeDrivers.length,
      totalGarages: garageList.length,
      totalCapacity,
      totalBikes: bikes.length,
      bikesGood,
      bikesIssue,
      totalOrders,
      avgRating: avgRating.toFixed(1),
      totalHours: fmtHours(totalHours),
      totalSessions: records.length,
      roleCount,
    };
  }, [users, garageList, drivers, bikes, records]);

  /* ── per-driver attendance summary ── */
  const driverSummaries = useMemo(() => {
    return drivers.map((d) => {
      const dRecords = records
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
      const assignedBike = d.bikeId ? bikes.find((b) => b.id === d.bikeId) : undefined;
      return { ...d, dRecords, totalOrders, avgRating, totalHours, isActive, assignedBike };
    });
  }, [drivers, records, bikes]);

  return (
    <div className="space-y-8">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard icon={Users} label="System Users" value={stats.totalUsers} sub={`${stats.roleCount["admin"] ?? 0} admins · ${stats.roleCount["supervisor"] ?? 0} supervisors`} tone="brand" />
        <StatCard icon={UserCheck} label="Total Drivers" value={stats.totalDrivers} sub={`${stats.activeDrivers} active`} tone="emerald" />
        <StatCard icon={Warehouse} label="Garages" value={stats.totalGarages} sub={`${stats.totalCapacity} capacity`} tone="sky" />
        <StatCard icon={Bike} label="Fleet Bikes" value={stats.totalBikes} sub={`${stats.bikesGood} good · ${stats.bikesIssue} issue`} tone={stats.bikesIssue > 0 ? "amber" : "emerald"} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard icon={Package} label="Total Orders" value={stats.totalOrders} sub={`${stats.totalSessions} sessions`} tone="violet" />
        <StatCard icon={Star} label="Avg. Rating" value={stats.avgRating} sub="performance" tone="amber" />
        <StatCard icon={Clock} label="Total Hours" value={stats.totalHours} sub="work time" tone="sky" />
        <StatCard icon={Activity} label="Active Now" value={stats.activeDrivers} sub="on shift" tone={stats.activeDrivers > 0 ? "emerald" : "rose"} />
      </div>

      {/* ── Two-column middle row ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Users breakdown */}
        <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
          <div className="mb-5 flex items-center justify-between">
            <SectionTitle icon={Users} title="System Users" badge={users.length} />
            <span className="text-xs text-slate-400">Roles distribution</span>
          </div>
          <div className="space-y-3">
            {users.map((u) => {
              const garage = u.garageId ? garageList.find((g) => g.id === u.garageId) : undefined;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl bg-surface-50/80 px-4 py-3 ring-1 ring-surface-100"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-surface-900">{u.name}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                    {garage && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Warehouse className="h-3 w-3" />
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
          <div className="mt-5 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Role Distribution</p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-100">
              {ROLES.map((r, i) => {
                const count = stats.roleCount[r.id] ?? 0;
                const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                const colors = ["bg-rose-400", "bg-violet-400", "bg-brand-400", "bg-sky-400"];
                return pct > 0 ? (
                  <div
                    key={r.id}
                    className={cn(colors[i], "transition-all")}
                    style={{ width: `${pct}%` }}
                  />
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {ROLES.map((r, i) => {
                const count = stats.roleCount[r.id] ?? 0;
                const dotColors = ["bg-rose-400", "bg-violet-400", "bg-brand-400", "bg-sky-400"];
                return (
                  <span key={r.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={cn("h-2 w-2 rounded-full", dotColors[i])} />
                    {r.label}: {count}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Garages breakdown - hidden for garage managers */}
        {!isGarageManager && (
          <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
            <div className="mb-5 flex items-center justify-between">
              <SectionTitle icon={Warehouse} title="Garage Network" badge={garageList.length} />
              <span className="text-xs text-slate-400">Capacity overview</span>
            </div>
            <div className="space-y-4">
              {garageList.map((g) => {
                const manager = g.managerId ? users.find((u) => u.id === g.managerId) : undefined;
                const maxCap = Math.max(...garageList.map((x) => x.capacity), 1);
                const pct = Math.round((g.capacity / maxCap) * 100);
                return (
                  <div
                    key={g.id}
                    className="rounded-xl bg-surface-50/80 px-4 py-3 ring-1 ring-surface-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-surface-900">{g.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {g.location}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                        {g.capacity} slots
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Capacity</span>
                        <span>{pct}% of fleet max</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {manager ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <ShieldCheck className="h-3 w-3 text-brand-500" />
                        Manager: <span className="font-medium text-surface-800">{manager.name}</span>
                      </p>
                    ) : (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <UserX className="h-3 w-3 text-rose-400" />
                        No manager assigned
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Fleet Bikes ── */}
      <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
        <div className="mb-5 flex items-center justify-between">
          <SectionTitle icon={Bike} title="Fleet Bikes" badge={bikes.length} />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Good: {stats.bikesGood}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Issues: {stats.bikesIssue}
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => {
            const driver = bike.driverId
              ? drivers.find((d) => d.id === bike.driverId)
              : undefined;
            return (
              <div
                key={bike.id}
                className={cn(
                  "rounded-xl p-4 ring-1 transition-all",
                  bike.status === "good"
                    ? "bg-emerald-50/60 ring-emerald-100"
                    : bike.status === "maintenance"
                    ? "bg-amber-50/60 ring-amber-100"
                    : "bg-rose-50/60 ring-rose-100"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-surface-900">{bike.plateNumber}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {bike.bikeType.replace("_", " ")} · {bike.color}
                    </p>
                  </div>
                  <BikeStatusBadge status={bike.status} />
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Registered: {fmtDate(bike.registrationDate)}
                  </p>
                  {driver ? (
                    <p className="flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3 text-brand-500" />
                      Driver: <span className="font-medium text-surface-800">{driver.name}</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <UserX className="h-3 w-3" />
                      Unassigned
                    </p>
                  )}
                  {bike.defectDescription && (
                    <p className="flex items-center gap-1.5 text-rose-500">
                      <AlertTriangle className="h-3 w-3" />
                      {bike.defectDescription}
                    </p>
                  )}
                  {bike.notes && (
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Settings2 className="h-3 w-3" />
                      {bike.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Driver Performance ── */}
      <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
        <div className="mb-5 flex items-center justify-between">
          <SectionTitle icon={TrendingUp} title="Driver Performance" badge={drivers.length} />
          <span className="text-xs text-slate-400">All-time attendance summary</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Driver</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bike</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Orders</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hours</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sessions</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {driverSummaries.map((d) => (
                <tr key={d.id} className="group">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900">{d.name}</p>
                        <p className="text-[11px] text-slate-400">Joined {fmtDate(d.joinDate)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    {d.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {d.assignedBike ? (
                      <div>
                        <p className="font-medium text-surface-800">{d.assignedBike.plateNumber}</p>
                        <BikeStatusBadge status={d.assignedBike.status} />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">— No bike</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-bold text-surface-900">
                    {d.totalOrders}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-slate-600">
                    {fmtHours(d.totalHours)}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-slate-600">
                    {d.dRecords.length}
                  </td>
                  <td className="py-3.5 text-right">
                    <StarRating rating={Math.round(d.avgRating)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Attendance Log ── */}
      <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
        <div className="mb-5 flex items-center justify-between">
          <SectionTitle icon={BarChart3} title="Attendance Log" badge={records.length} />
          <span className="text-xs text-slate-400">Recent sessions</span>
        </div>
        <div className="space-y-3">
          {[...records]
            .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
            .map((r) => {
              const driver = drivers.find((d) => d.id === r.driverId);
              const hours = calcHours(r.clockIn, r.clockOut);
              const isOpen = !r.clockOut;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex flex-wrap items-center gap-4 rounded-xl px-4 py-3.5 ring-1",
                    isOpen
                      ? "bg-emerald-50/70 ring-emerald-100"
                      : "bg-surface-50/80 ring-surface-100"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
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
                      <Clock className="h-3.5 w-3.5 text-brand-400" />
                      {new Date(r.clockIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      {" → "}
                      {r.clockOut
                        ? new Date(r.clockOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : <span className="font-semibold text-emerald-600">Now</span>}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-violet-400" />
                      {fmtHours(hours)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-surface-900">
                      <Package className="h-3.5 w-3.5 text-brand-500" />
                      {r.ordersDelivered} orders
                    </span>
                    <StarRating rating={r.rating} />
                    {isOpen && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
                    {r.notes && (
                      <span className="text-xs italic text-slate-400">&ldquo;{r.notes}&rdquo;</span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
