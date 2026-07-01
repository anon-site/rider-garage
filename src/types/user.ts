export const ROLES = [
  { id: "observer", label: "Observer" },
  { id: "supervisor", label: "Supervisor" },
  { id: "garage", label: "Manager" },
  { id: "admin", label: "Admin" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export type CustomPermissions = {
  canEdit?: boolean;
  canManageUsers?: boolean;
  canClockDriver?: boolean;
  canViewReports?: boolean;
  canViewDashboard?: boolean;
  canViewGarages?: boolean;
  canViewBikes?: boolean;
  canViewDrivers?: boolean;
  canViewSettings?: boolean;
};

/** User profile stored in Firebase — no password on client. */
export type PublicUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: RoleId;
  garageId?: string;
  customPermissions?: CustomPermissions | null;
  usernameLower?: string;
};

/** Server-only shape when creating/updating credentials. */
export type User = PublicUser & {
  password?: string;
};
