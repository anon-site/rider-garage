import type { BikeTypeId } from "./bike";

export type Driver = {
  id: string;
  name: string;
  phone: string;
  joinDate?: string;
  appId: string;
  garageId?: string;
  bikeId?: string;
  preferredBikeType?: BikeTypeId;
};
