"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, RotateCcw, Eye, EyeOff } from "lucide-react";
import type { User, RoleId, CustomPermissions } from "@/types/user";
import { ROLES } from "@/types/user";
import { useGarages } from "@/contexts/control-panel-context";
import { ROLE_PERMISSIONS } from "@/contexts/auth-context";
import { hashPassword, isHashedPassword } from "@/lib/crypto";

type EditUserModalProps = {
  user: User | null;
  onSave: (id: string, changes: Partial<Omit<User, "id">>) => void;
  onChangeId?: (oldId: string, newId: string) => Promise<void>;
  onClose: () => void;
  existingUsernames?: string[];
  existingIds?: string[];
};

const PERM_LABELS: { key: keyof CustomPermissions; label: string; desc: string }[] = [
  { key: "canEdit",         label: "Edit Records",    desc: "Add / edit / delete bikes and drivers" },
  { key: "canManageUsers",  label: "Control Panel",   desc: "Manage users, garages and settings" },
  { key: "canViewAll",      label: "View All Pages",  desc: "Access Bikes, Drivers and Dashboard" },
  { key: "canClockDriver",  label: "Clock Drivers",   desc: "Clock drivers in/out from Dashboard" },
  { key: "canViewReports",  label: "View Reports",    desc: "Access the analytics and reports page" },
];

export function EditUserModal({ user, onSave, onChangeId, onClose, existingUsernames = [], existingIds = [] }: EditUserModalProps) {
  const { garages } = useGarages();
  const [customId, setCustomId] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleId>("observer");
  const [garageId, setGarageId] = useState("");
  const [customPerms, setCustomPerms] = useState<CustomPermissions>({});

  const otherUsernames = user ? existingUsernames.filter(u => u !== user.username.toLowerCase()) : existingUsernames;
  const otherIds = user ? existingIds.filter(id => id !== user.id) : existingIds;
  const isDuplicateUsername = username.trim() !== "" && otherUsernames.includes(username.trim().toLowerCase());
  const isDuplicateId = customId.trim() !== "" && otherIds.includes(customId.trim());

  useEffect(() => {
    if (user) {
      setCustomId(user.id);
      setName(user.name);
      setUsername(user.username);
      setPassword(user.password);
      setEmail(user.email);
      setPhone(user.phone);
      setRole(user.role);
      setGarageId(user.garageId ?? "");
      setCustomPerms(user.customPermissions ?? {});
    }
  }, [user]);

  if (!user) return null;

  /* When role changes, reset custom perms so defaults apply */
  function handleRoleChange(newRole: RoleId) {
    setRole(newRole);
    if (newRole !== "garage") setGarageId("");
    setCustomPerms({});
  }

  function togglePerm(key: keyof CustomPermissions) {
    const base = ROLE_PERMISSIONS[role][key];
    const current = customPerms[key] ?? base;
    /* If toggling back to default, remove override */
    const next = !current;
    if (next === base) {
      setCustomPerms((p) => { const c = { ...p }; delete c[key]; return c; });
    } else {
      setCustomPerms((p) => ({ ...p, [key]: next }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim() || !user) return;
    if (isDuplicateUsername || isDuplicateId) return;

    // Handle ID change if different
    if (customId.trim() && customId.trim() !== user.id && onChangeId) {
      await onChangeId(user.id, customId.trim());
    }

    // Hash password if it's been changed (not the same as existing)
    let finalPassword = password;
    if (password !== user.password) {
      finalPassword = await hashPassword(password);
    }

    const changes: Partial<Omit<User, "id">> = { name, username, password: finalPassword, email, phone, role };
    if (role === "garage" && garageId) {
      changes.garageId = garageId;
    } else {
      changes.garageId = undefined;
    }
    // Save customPermissions: use null to clear existing overrides, or the object if has overrides
    changes.customPermissions = Object.keys(customPerms).length > 0 ? customPerms : null;
    // Always use original user.id - ID change is handled separately by onChangeId
    onSave(user.id, changes);
    onClose();
  }

  const hasOverrides = Object.keys(customPerms).length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-surface-900 to-surface-800 p-5 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Edit User</h3>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 ring-1 ring-white/15 transition-colors hover:bg-white/20 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* User ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">User ID</label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value.replace(/\s+/g, ""))}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:ring-2 ${
                isDuplicateId
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                  : customId.trim() && !isDuplicateId && customId.trim() !== user?.id
                  ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                  : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
              }`}
            />
            {isDuplicateId && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                This ID already exists. Please choose a different one.
              </p>
            )}
            {customId.trim() && !isDuplicateId && customId.trim() !== user?.id && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ID will be changed on save
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">
                Email <span className="text-slate-400 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Login credentials */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Login Credentials</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-surface-900">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  autoComplete="off"
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:ring-2 ${
                    isDuplicateUsername
                      ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                      : username.trim() && !isDuplicateUsername
                      ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                      : "border-surface-200 focus:border-brand-400 focus:ring-brand-100"
                  }`}
                />
                {isDuplicateUsername && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                    This username already exists. Please choose a different one.
                  </p>
                )}
                {username.trim() && !isDuplicateUsername && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Username is available
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-surface-900">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 pr-10 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-900">Role</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as RoleId)}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* ── Permissions ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Permissions</p>
              </div>
              {hasOverrides && (
                <button
                  type="button"
                  onClick={() => setCustomPerms({})}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset to role defaults
                </button>
              )}
            </div>
            <div className="space-y-2">
              {PERM_LABELS.map(({ key, label, desc }) => {
                const base = ROLE_PERMISSIONS[role][key];
                const effective = customPerms[key] ?? base;
                const isOverridden = customPerms[key] !== undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePerm(key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                      effective
                        ? "bg-white ring-1 ring-violet-200 shadow-sm"
                        : "bg-white/50 ring-1 ring-surface-200"
                    }`}
                  >
                    {/* Toggle */}
                    <div className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      effective ? "bg-violet-600" : "bg-surface-300"
                    }`}>
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        effective ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </div>
                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-semibold ${
                          effective ? "text-surface-900" : "text-slate-400"
                        }`}>{label}</span>
                        {isOverridden && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            effective !== base
                              ? "bg-amber-100 text-amber-700"
                              : "bg-surface-100 text-slate-400"
                          }`}>
                            {effective ? "granted" : "revoked"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{desc}</p>
                    </div>
                    {/* Default indicator */}
                    {!isOverridden && (
                      <span className="shrink-0 text-[10px] font-medium text-slate-400">default</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {role === "garage" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-900">
                Assigned Garage
              </label>
              <select
                required
                value={garageId}
                onChange={(e) => setGarageId(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select a garage</option>
                {garages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDuplicateUsername || isDuplicateId}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.98] ${
                isDuplicateUsername || isDuplicateId
                  ? "bg-surface-200 text-slate-400 cursor-not-allowed"
                  : "bg-brand-600 text-white shadow-brand-200 hover:bg-brand-700"
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
