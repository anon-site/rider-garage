import type { RoleId } from "@/types/user";

/** Custom claims embedded in Firebase Auth tokens. */
export type AuthClaims = {
  role: RoleId;
  userId: string;
  garageId?: string;
};

export function buildAuthClaims(profile: {
  id: string;
  role: RoleId;
  garageId?: string;
}): AuthClaims {
  return {
    role: profile.role,
    userId: profile.id,
    ...(profile.garageId ? { garageId: profile.garageId } : {}),
  };
}
