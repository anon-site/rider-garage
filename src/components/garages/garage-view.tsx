"use client";

import { useMemo } from "react";
import {
  Warehouse, Bike as BikeIcon, Users, CheckCircle2,
  AlertTriangle, Clock, MapPin, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useGarages } from "@/contexts/control-panel-context";
import { useBikes } from "@/contexts/bikes-context";
import { useDrivers } from "@/contexts/drivers-context";
import { BikeList } from "@/components/bikes/bike-list";
import { DriverList } from "@/components/drivers/driver-list";

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number;
  tone: "brand" | "emerald" | "amber" | "rose";
}) {
  const toneClasses = {
    brand: "from-brand-500/15 to-brand-500/5 text-brand-600",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-600",
  };
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/60">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${toneClasses[tone]} opacity-50 blur-xl`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export function GarageView() {
  const { user } = useAuth();
  const { garages } = useGarages();
  const { bikes } = useBikes();
  const { drivers } = useDrivers();

  const garage = useMemo(
    () => garages.find((g) => g.id === user?.garageId),
    [garages, user?.garageId]
  );

  const myBikes = useMemo(
    () => bikes.filter((b) => b.garageId === user?.garageId),
    [bikes, user?.garageId]
  );

  const myDrivers = useMemo(
    () => drivers.filter((d) => d.garageId === user?.garageId),
    [drivers, user?.garageId]
  );

  const bikeStats = useMemo(() => ({
    total: myBikes.length,
    good: myBikes.filter((b) => b.status === "good").length,
    defective: myBikes.filter((b) => b.status === "defective").length,
  }), [myBikes]);

  const driverStats = useMemo(() => ({
    total: myDrivers.length,
    withBike: myDrivers.filter((d) => d.bikeId).length,
    waiting: myDrivers.filter((d) => !d.bikeId).length,
  }), [myDrivers]);

  /* Guard: no garageId assigned */
  if (!user?.garageId || !garage) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </span>
        <div>
          <p className="text-lg font-bold text-surface-900">No Garage Assigned</p>
          <p className="mt-1 text-sm text-slate-500">Your account is not linked to any garage. Contact the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Garage Info Card ─────────────────────────────────────── */}
      <div className="glass-panel overflow-hidden rounded-3xl ring-1 ring-white/60">
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 px-6 py-5">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/30">
              <Warehouse className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{garage.name}</h2>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                <span>{garage.location}</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Capacity</p>
              <p className="text-2xl font-bold text-white">{garage.capacity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={BikeIcon}      label="Total Bikes"    value={bikeStats.total}    tone="brand" />
        <StatCard icon={CheckCircle2}  label="Good Bikes"     value={bikeStats.good}     tone="emerald" />
        <StatCard icon={AlertTriangle} label="Defective"      value={bikeStats.defective} tone="rose" />
        <StatCard icon={Users}         label="Total Drivers"  value={driverStats.total}  tone="brand" />
        <StatCard icon={Clock}         label="Waiting"        value={driverStats.waiting} tone="amber" />
      </div>

      {/* ── Bikes ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-surface-900">
              <BikeIcon className="h-5 w-5 text-brand-500" />
              Bikes
            </h3>
            <p className="text-sm text-slate-500">{bikeStats.total} bikes in this garage</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {bikeStats.total} total
          </span>
        </div>
        {myBikes.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400 ring-1 ring-white/60">
            No bikes assigned to this garage yet.
          </div>
        ) : (
          <BikeList bikes={myBikes} onEdit={() => {}} onDelete={() => {}} readOnly />
        )}
      </div>

      {/* ── Drivers ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-surface-900">
              <Users className="h-5 w-5 text-brand-500" />
              Drivers
            </h3>
            <p className="text-sm text-slate-500">{driverStats.total} drivers in this garage</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {driverStats.total} total
          </span>
        </div>
        {myDrivers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400 ring-1 ring-white/60">
            No drivers assigned to this garage yet.
          </div>
        ) : (
          <DriverList drivers={myDrivers} onEdit={() => {}} onDelete={() => {}} readOnly />
        )}
      </div>
    </div>
  );
}
