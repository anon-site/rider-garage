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
  canViewAll?: boolean;
  canClockDriver?: boolean;
  canViewReports?: boolean;
};

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: RoleId;
  garageId?: string;
  customPermissions?: CustomPermissions | null;
};
