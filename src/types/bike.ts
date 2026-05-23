export const BIKE_TYPES = [
  { id: "electric_motorcycle", label: "Electric Motorcycle" },
  { id: "electric_bicycle", label: "Electric Bicycle" },
] as const;

export type BikeTypeId = (typeof BIKE_TYPES)[number]["id"];

export const BIKE_STATUSES = [
  { id: "good", label: "Good" },
  { id: "maintenance", label: "Needs Maintenance" },
  { id: "defective", label: "Has Defect" },
] as const;

export type BikeStatusId = (typeof BIKE_STATUSES)[number]["id"];

export type Bike = {
  id: string;
  plateNumber: string;
  color: string;
  bikeType: BikeTypeId;
  garageId?: string | null;
  driverId?: string | null;
  status: BikeStatusId;
  defectDescription?: string | null;
  registrationDate: string;
  notes?: string | null;
};
