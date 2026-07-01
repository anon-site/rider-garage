import type { PublicUser } from "@/types/user";

/** Strip legacy password field if still present in database records. */
export function toPublicUser(id: string, data: Record<string, unknown>): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = data;
  return { ...rest, id } as PublicUser;
}

export function stripPassword<T extends { password?: string }>(
  user: T
): Omit<T, "password"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function userProfilePayload(
  user: Omit<PublicUser, "id"> & { username: string }
): Omit<PublicUser, "id"> & { usernameLower: string } {
  return {
    ...user,
    usernameLower: normalizeUsername(user.username),
  };
}
