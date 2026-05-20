export type AttendanceRecord = {
  id: string;
  driverId: string;
  clockIn: string; // ISO datetime
  clockOut?: string; // ISO datetime
  ordersDelivered: number;
  rating: number; // 1–5
  notes?: string;
};
