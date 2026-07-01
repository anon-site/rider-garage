"use client";

import { useCallback } from "react";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useUsers, useGarages } from "@/contexts/control-panel-context";
import { useAttendance } from "@/contexts/attendance-context";
import { ImportExportSection } from "./import-export-section";
import type { ImportSiteData } from "@/lib/data-io";

export function SettingsClientPage() {
  const { addDriver } = useDrivers();
  const { addBike } = useBikes();
  const { addUser } = useUsers();
  const { addGarage } = useGarages();
  const { addRecord } = useAttendance();

  const handleImport = useCallback(
    (data: Partial<ImportSiteData>) => {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      if (data.drivers) data.drivers.forEach(({ id, ...rest }) => addDriver(rest, id));
      if (data.bikes) data.bikes.forEach(({ id, ...rest }) => addBike(rest, id));
      if (data.users) data.users.forEach(({ id, ...rest }) => addUser(rest, id));
      if (data.garages) data.garages.forEach(({ id, ...rest }) => addGarage(rest, id));
      if (data.attendance) data.attendance.forEach(({ id, ...rest }) => addRecord(rest));
      /* eslint-enable @typescript-eslint/no-unused-vars */
    },
    [addDriver, addBike, addUser, addGarage, addRecord]
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ImportExportSection onImport={handleImport} />
    </div>
  );
}
