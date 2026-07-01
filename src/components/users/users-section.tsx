"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X, LayoutGrid, List } from "lucide-react";
import { useUsers } from "@/contexts/control-panel-context";
import { UserList } from "./user-list";
import { AddUserModal } from "./add-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { ROLES } from "@/types/user";
import type { PublicUser } from "@/types/user";

type ViewMode = "list" | "grid";

export function UsersSection() {
  const { users, addUser, updateUser, changeUserId, deleteUser } = useUsers();
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email?.toLowerCase().includes(q) ?? false) ||
      u.phone.toLowerCase().includes(q) ||
      (ROLES.find((r) => r.id === u.role)?.label.toLowerCase().includes(q) ?? false)
    );
  }, [users, query]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-surface-900">Users</h3>
          <p className="text-sm text-slate-400">{users.length} total members</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-surface-100 p-1 ring-1 ring-surface-200">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition-all ${
                viewMode === "list"
                  ? "bg-white text-brand-600 shadow-sm ring-1 ring-surface-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition-all ${
                viewMode === "grid"
                  ? "bg-white text-brand-600 shadow-sm ring-1 ring-surface-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username, email, role…"
          className="glass-panel w-full rounded-2xl border-0 py-3 pl-11 pr-10 text-sm text-surface-900 placeholder-slate-400 ring-1 ring-white/60 outline-none transition-all focus:ring-2 focus:ring-brand-400 focus:shadow-md"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results badge */}
      {query && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            <Search className="h-3 w-3" />
            {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
          </span>
          <button type="button" onClick={() => setQuery("")}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Clear search
          </button>
        </div>
      )}

      <UserList
        users={filteredUsers}
        onEdit={setEditingUser}
        onDelete={deleteUser}
        viewMode={viewMode}
      />

      {showAdd && (
        <AddUserModal
          onSubmit={addUser}
          onClose={() => setShowAdd(false)}
          existingUsernames={users.map(u => u.username.toLowerCase())}
          existingIds={users.map(u => u.id)}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={updateUser}
          onChangeId={changeUserId}
          onClose={() => setEditingUser(null)}
          existingUsernames={users.map(u => u.username.toLowerCase())}
          existingIds={users.map(u => u.id)}
        />
      )}
    </div>
  );
}
