export type AppNotificationType = "driver_exit" | "driver_entry";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  driverId: string;
  recordId: string;
  createdAt: string;
  read: boolean;
};
