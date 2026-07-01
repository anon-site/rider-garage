import type { RoleId } from "@/types/user";

export type NotificationSubscriber = {
  id: string;
  role: RoleId;
  garageId?: string;
};

/** Garage managers only see their garage; admin/supervisor/observer see all. */
export function shouldNotifyUserForDriverGarage(
  user: NotificationSubscriber,
  driverGarageId?: string | null
): boolean {
  if (user.role === "admin" || user.role === "supervisor" || user.role === "observer") {
    return true;
  }

  if (user.role === "garage") {
    if (!user.garageId || !driverGarageId) return false;
    return user.garageId === driverGarageId;
  }

  return false;
}

export function getDriverGarageId(
  drivers: { id: string; garageId?: string }[],
  driverId: string
): string | undefined {
  return drivers.find((d) => d.id === driverId)?.garageId;
}
