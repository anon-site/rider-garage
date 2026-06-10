import type { BikeTypeId } from "./bike";
import type { DeliveryCategoryId } from "./delivery-category";

export type Driver = {
  id: string;
  name: string;
  phone: string;
  joinDate?: string;
  appId: string;
  garageId?: string;
  bikeId?: string;
  preferredBikeType?: BikeTypeId;
  deliveryCategoryIds?: DeliveryCategoryId[];
};
