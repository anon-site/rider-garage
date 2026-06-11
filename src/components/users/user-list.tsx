"use client";

import { useState } from "react";
import { Pencil, Trash2, Mail, Phone, Store, User as UserIcon, AtSign, ShieldCheck, Fingerprint, Crown, Eye, Wrench } from "lucide-react";
import type { User, RoleId, CustomPermissions } from "@/types/user";
import { ROLES } from "@/types/user";
import { useGarages } from "@/contexts/control-panel-context";
import { ROLE_PERMISSIONS } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";

const PERM_LABELS: Record<keyof CustomPermissions, string> = {
  canEdit:        "Edit",
  canManageUsers: "Control Panel",
  canViewAll:     "View All",
  canClockDriver: "Clock",
  canViewReports: "Reports",
};

const PERM_ICONS: Record<keyof CustomPermissions, typeof Eye> = {
  canEdit:        Wrench,
  canManageUsers: Crown,
  canViewAll:     Eye,
  canClockDriver: ShieldCheck,
  canViewReports: ShieldCheck,
};

type ViewMode = "list" | "grid";

type UserListProps = {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
};

const ROLE_CONFIG: Record<RoleId, { 
  gradient: string; 
  bg: string; 
  text: string; 
  ring: string;
  icon: string;
}> = {
  admin: {
    gradient: "from-rose-400 to-rose-600",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    icon: "text-rose-500",
  },
  supervisor: {
    gradient: "from-violet-400 to-violet-600",
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
    icon: "text-violet-500",
  },
  garage: {
    gradient: "from-amber-400 to-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    icon: "text-amber-500",
  },
  observer: {
    gradient: "from-sky-400 to-sky-600",
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    icon: "text-sky-500",
  },
};

function RoleBadge({ role }: { role: RoleId }) {
  const label = ROLES.find((r) => r.id === role)?.label ?? role;
  const config = ROLE_CONFIG[role];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
      config.bg,
      config.text,
      config.ring
    )}>
      <Crown className={cn("h-3 w-3", config.icon)} />
      {label}
    </span>
  );
}

function UserAvatar({ name, role }: { name: string; role: RoleId }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const config = ROLE_CONFIG[role];
  return (
    <div className={cn(
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-sm font-bold shadow-lg",
      config.gradient
    )}>
      {initials}
    </div>
  );
}

function InfoChip({ icon: Icon, children, className }: { icon: typeof Mail; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs text-slate-500",
      className
    )}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export function UserList({ users, onEdit, onDelete, viewMode = "grid" }: UserListProps) {
  const { garages } = useGarages();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isGrid = viewMode === "grid";
  const garageNameMap = Object.fromEntries(garages.map((g) => [g.id, g.name]));

  function handleDeleteClick(id: string) {
    setDeletingId(id);
  }

  if (users.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
          <UserIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-surface-900">
          No Users Yet
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add your first user using the form above.
        </p>
      </div>
    );
  }

  // LIST VIEW
  if (!isGrid) {
    return (
      <div className="space-y-2">
        {users.map((user) => {
          const hasOverrides = user.customPermissions && Object.keys(user.customPermissions).length > 0;
          return (
            <div
              key={user.id}
              className="group relative flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-surface-200 transition-all hover:shadow-md hover:ring-brand-200"
            >
              {/* Avatar */}
              <UserAvatar name={user.name} role={user.role} />

              {/* Main Info */}
              <div className="flex min-w-0 flex-1 items-center gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="truncate text-sm font-bold text-surface-900">
                      {user.name}
                    </h4>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <InfoChip icon={AtSign} className="font-medium text-brand-600">
                      {user.username}
                    </InfoChip>
                    {user.email && (
                      <InfoChip icon={Mail}>{user.email}</InfoChip>
                    )}
                    {user.phone && (
                      <InfoChip icon={Phone}>{user.phone}</InfoChip>
                    )}
                    {user.role === "garage" && user.garageId && (
                      <InfoChip icon={Store} className="text-amber-600">
                        {garageNameMap[user.garageId] ?? "Unknown Garage"}
                      </InfoChip>
                    )}
                  </div>
                </div>

                {/* ID & Permissions */}
                <div className="hidden lg:flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-500">
                    <Fingerprint className="h-3 w-3" />
                    {user.id}
                  </span>
                  {hasOverrides && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Permissions:</span>
                      <div className="flex gap-1">
                        {(Object.keys(user.customPermissions!) as (keyof CustomPermissions)[]).slice(0, 3).map((key) => {
                          const base = ROLE_PERMISSIONS[user.role][key];
                          const val = user.customPermissions![key]!;
                          const granted = val !== base ? val : null;
                          if (granted === null) return null;
                          const PermIcon = PERM_ICONS[key];
                          return (
                            <span
                              key={key}
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full",
                                granted ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                              )}
                              title={`${PERM_LABELS[key]}: ${granted ? "Granted" : "Revoked"}`}
                            >
                              <PermIcon className="h-3 w-3" />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Edit user"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(user.id)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                    deletingId === user.id
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-surface-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                  )}
                  aria-label={deletingId === user.id ? "Confirm delete" : "Delete user"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {deletingId && (
          <ConfirmDeleteModal
            title="Delete User"
            description="This action cannot be undone."
            onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
            onCancel={() => setDeletingId(null)}
          />
        )}
      </div>
    );
  }

  // GRID VIEW
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="group relative flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-surface-200 transition-all hover:shadow-lg hover:ring-brand-200"
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <UserAvatar name={user.name} role={user.role} />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-surface-900">
                {user.name}
              </h4>
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2">
              <AtSign className="h-4 w-4 text-brand-500" />
              <span className="truncate text-sm font-medium text-surface-800">
                {user.username}
              </span>
            </div>
            {user.email && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="h-3.5 w-3.5" />
                <span className="truncate">{user.phone}</span>
              </div>
            )}
            {user.role === "garage" && user.garageId && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <Store className="h-3.5 w-3.5" />
                <span className="truncate">{garageNameMap[user.garageId] ?? "Unknown Garage"}</span>
              </div>
            )}
          </div>

          {/* ID & Permissions */}
          <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-1 text-[10px] font-mono text-slate-500">
              <Fingerprint className="h-3 w-3" />
              {user.id}
            </span>
            {user.customPermissions && Object.keys(user.customPermissions).length > 0 && (
              <div className="flex gap-0.5">
                {(Object.keys(user.customPermissions) as (keyof CustomPermissions)[]).slice(0, 3).map((key) => {
                  const base = ROLE_PERMISSIONS[user.role][key];
                  const val = user.customPermissions![key]!;
                  const granted = val !== base ? val : null;
                  if (granted === null) return null;
                  const PermIcon = PERM_ICONS[key];
                  return (
                    <span
                      key={key}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        granted ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}
                      title={`${PERM_LABELS[key]}: ${granted ? "Granted" : "Revoked"}`}
                    >
                      <PermIcon className="h-3 w-3" />
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-50 py-2 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(user.id)}
              className={cn(
                "flex items-center justify-center rounded-xl px-4 transition-all",
                deletingId === user.id
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {deletingId && (
        <ConfirmDeleteModal
          title="Delete User"
          description="This action cannot be undone."
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
