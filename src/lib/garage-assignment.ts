import type { Garage } from "@/types/garage";

export type GarageAssignmentOption = {
  id: string;
  name: string;
  location: string;
  available: boolean;
  managerName?: string;
};

type ManagerLookup = { id: string; name: string };

export function buildGarageAssignmentOptions(
  garages: Garage[],
  users: ManagerLookup[],
  currentManagerUserId?: string
): GarageAssignmentOption[] {
  return [...garages]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((garage) => {
      const occupiedByOther =
        Boolean(garage.managerId) && garage.managerId !== currentManagerUserId;
      const manager = garage.managerId
        ? users.find((user) => user.id === garage.managerId)
        : undefined;

      return {
        id: garage.id,
        name: garage.name,
        location: garage.location,
        available: !occupiedByOther,
        managerName: manager?.name,
      };
    });
}

export function isGarageAssignable(
  garages: Garage[],
  garageId: string,
  currentManagerUserId?: string
): boolean {
  const garage = garages.find((g) => g.id === garageId);
  if (!garage) return false;
  if (!garage.managerId) return true;
  return garage.managerId === currentManagerUserId;
}
