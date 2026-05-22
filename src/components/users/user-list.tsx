"use client";

import { useState } from "react";
import { Pencil, Trash2, Mail, Phone, Store, User as UserIcon, AtSign, ShieldCheck, ShieldOff, Fingerprint } from "lucide-react";
import type { User, RoleId, CustomPermissions } from "@/types/user";
import { ROLES } from "@/types/user";
import { useGarages } from "@/contexts/control-panel-context";
import { ROLE_PERMISSIONS } from "@/contexts/auth-context";

const PERM_LABELS: Record<keyof CustomPermissions, string> = {
  canEdit:        "Edit",
  canManageUsers: "Control Panel",
  canViewAll:     "View All",
  canClockDriver: "Clock",
  canViewReports: "Reports",
};

type UserListProps = {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
};

function RoleBadge({ role }: { role: RoleId }) {
  const label = ROLES.find((r) => r.id === role)?.label ?? role;
  const styles: Record<RoleId, string> = {
    observer: "bg-slate-50 text-slate-600 ring-slate-200",
    supervisor: "bg-blue-50 text-blue-700 ring-blue-200",
    garage: "bg-amber-50 text-amber-700 ring-amber-200",
    admin: "bg-brand-50 text-brand-700 ring-brand-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${styles[role]}`}
    >
      {label}
    </span>
  );
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
  const { garages } = useGarages();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const garageNameMap = Object.fromEntries(garages.map((g) => [g.id, g.name]));

  function confirmDelete(id: string) {
    if (deletingId === id) {
      onDelete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  if (users.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <UserIcon className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-surface-900">
          No Users Yet
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add your first user using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="glass-panel flex flex-col gap-4 rounded-2xl p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-surface-900">
                    {user.name}
                  </h4>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  {/* User ID Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ${
                      user.id.match(/^-[A-Za-z0-9_-]{19,}$/) || user.id.length > 15
                        ? "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                        : "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                    }`}
                    title="User ID"
                  >
                    <Fingerprint className="h-3 w-3" />
                    {user.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-brand-600">
                    <AtSign className="h-3.5 w-3.5" />
                    {user.username}
                  </span>
                  {user.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                  )}
                  {user.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {user.phone}
                    </span>
                  )}
                  {user.role === "garage" && user.garageId && (
                    <span className="inline-flex items-center gap-1.5 text-amber-600">
                      <Store className="h-3.5 w-3.5" />
                      {garageNameMap[user.garageId] ?? "Unknown Garage"}
                    </span>
                  )}
                </div>
              </div>

              {/* Custom permission overrides */}
              {user.customPermissions && Object.keys(user.customPermissions).length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Overrides:</span>
                  {(Object.keys(user.customPermissions) as (keyof CustomPermissions)[]).map((key) => {
                    const base = ROLE_PERMISSIONS[user.role][key];
                    const val = user.customPermissions![key]!;
                    const granted = val !== base ? val : null;
                    if (granted === null) return null;
                    return (
                      <span key={key} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                        granted
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}>
                        {granted ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldOff className="h-2.5 w-2.5" />}
                        {PERM_LABELS[key]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-700 shadow-sm transition-colors hover:bg-surface-100"
              aria-label="Edit user"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => confirmDelete(user.id)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium shadow-sm transition-colors ${
                deletingId === user.id
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-surface-200 bg-white text-surface-700 hover:bg-red-50 hover:text-red-600"
              }`}
              aria-label={
                deletingId === user.id ? "Confirm delete" : "Delete user"
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {deletingId === user.id && (
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
