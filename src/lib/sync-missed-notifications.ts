import type { AttendanceRecord } from "@/types/attendance";
import type { AppNotificationType } from "@/types/notification";
import {
  buildDriverMovementMessage,
  type DriverMovementKind,
} from "@/lib/driver-movement-notify";
import {
  getDriverGarageId,
  shouldNotifyUserForDriverGarage,
  type NotificationSubscriber,
} from "@/lib/notification-scope";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function driverName(drivers: { id: string; name: string }[], driverId: string) {
  return drivers.find((d) => d.id === driverId)?.name ?? driverId;
}

type AddNotificationFn = (input: {
  type: AppNotificationType;
  title: string;
  message: string;
  driverId: string;
  recordId: string;
}) => void;

export function syncMissedNotifications(options: {
  records: Map<string, AttendanceRecord>;
  drivers: { id: string; name: string; garageId?: string }[];
  user: NotificationSubscriber;
  sinceIso: string;
  existingKeys: Set<string>;
  addNotification: AddNotificationFn;
}): number {
  const { records, drivers, user, sinceIso, existingKeys, addNotification } = options;
  const since = new Date(sinceIso).getTime();
  let added = 0;

  const push = (
    kind: DriverMovementKind,
    recordId: string,
    driverId: string,
    name: string,
    timeIso: string
  ) => {
    const type: AppNotificationType = kind === "exit" ? "driver_exit" : "driver_entry";
    const key = `${type}:${recordId}`;
    if (existingKeys.has(key)) return;

    const isExit = kind === "exit";
    addNotification({
      type,
      title: isExit ? "Driver left garage" : "Driver returned",
      message: buildDriverMovementMessage(name, formatTime(timeIso), kind),
      driverId,
      recordId,
    });
    existingKeys.add(key);
    added += 1;
  };

  for (const [id, record] of records) {
    const garageId = getDriverGarageId(drivers, record.driverId);
    if (!shouldNotifyUserForDriverGarage(user, garageId)) continue;

    const name = driverName(drivers, record.driverId);

    if (new Date(record.clockIn).getTime() > since) {
      push("exit", id, record.driverId, name, record.clockIn);
    }

    if (record.clockOut && new Date(record.clockOut).getTime() > since) {
      push("entry", id, record.driverId, name, record.clockOut);
    }
  }

  return added;
}
