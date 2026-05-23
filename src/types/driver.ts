import type { BikeTypeId } from "./bike";

export type Driver = {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  email?: string | null;
  garageId?: string | null;
  bikeId?: string | null;
  preferredBikeType?: BikeTypeId;
};
