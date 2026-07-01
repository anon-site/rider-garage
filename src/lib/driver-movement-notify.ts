import { notifyAttendanceMovement } from "@/lib/browser-notifications";
import { playAttendanceSound } from "@/lib/notification-sounds";
import type { AppNotificationType } from "@/types/notification";

export type DriverMovementKind = "exit" | "entry";

type ToastFn = (type: "success" | "error" | "info", message: string) => void;

type AddNotificationFn = (input: {
  type: AppNotificationType;
  title: string;
  message: string;
  driverId: string;
  recordId: string;
}) => void;

export function buildDriverMovementMessage(
  driverName: string,
  time: string,
  kind: DriverMovementKind
): string {
  return kind === "exit"
    ? `${driverName} left the garage at ${time}`
    : `${driverName} returned to the garage at ${time}`;
}

export function notifyDriverMovement(options: {
  kind: DriverMovementKind;
  driverId: string;
  driverName: string;
  time: string;
  recordId: string;
  toast: ToastFn;
  addNotification: AddNotificationFn;
}): void {
  const { kind, driverId, driverName, time, recordId, toast, addNotification } = options;
  const message = buildDriverMovementMessage(driverName, time, kind);
  const isExit = kind === "exit";

  toast(isExit ? "info" : "success", message);
  playAttendanceSound(kind);

  addNotification({
    type: isExit ? "driver_exit" : "driver_entry",
    title: isExit ? "Driver left garage" : "Driver returned",
    message,
    driverId,
    recordId,
  });

  notifyAttendanceMovement(
    isExit ? "Driver left garage" : "Driver returned",
    message,
    `attendance-${kind}-${recordId}`
  );
}
