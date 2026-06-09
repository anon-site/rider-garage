"use client";

import { useCallback } from "react";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useUsers, useGarages } from "@/contexts/control-panel-context";
import { useAttendance } from "@/contexts/attendance-context";
import { ImportExportSection } from "./import-export-section";
import type { SiteData } from "@/lib/data-io";

export function SettingsClientPage() {
  const { drivers, addDriver } = useDrivers();
  const { bikes, addBike } = useBikes();
  const { users, addUser } = useUsers();
  const { garages, addGarage } = useGarages();
  const { records, addRecord } = useAttendance();

  const handleImport = useCallback(
    (data: Partial<SiteData>) => {
      if (data.drivers) data.drivers.forEach(({ id: _id, ...rest }) => addDriver(rest));
      if (data.bikes) data.bikes.forEach(({ id: _id, ...rest }) => addBike(rest));
      if (data.users) data.users.forEach(({ id: _id, ...rest }) => addUser(rest));
      if (data.garages) data.garages.forEach(({ id: _id, ...rest }) => addGarage(rest));
      if (data.attendance) data.attendance.forEach(({ id: _id, ...rest }) => addRecord(rest));
    },
    [addDriver, addBike, addUser, addGarage, addRecord]
  );

  return (
    <div className="space-y-6">
      <ImportExportSection onImport={handleImport} />
    </div>
  );
}
