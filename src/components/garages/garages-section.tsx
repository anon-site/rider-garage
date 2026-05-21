"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X } from "lucide-react";
import { useGarages, useUsers } from "@/contexts/control-panel-context";
import { GarageList } from "./garage-list";
import { AddGarageModal } from "./add-garage-modal";
import { EditGarageModal } from "./edit-garage-modal";
import type { Garage } from "@/types/garage";

export function GaragesSection() {
  const { garages, addGarage, updateGarage, deleteGarage } = useGarages();
  const { users } = useUsers();
  const [showAdd, setShowAdd] = useState(false);
  const [editingGarage, setEditingGarage] = useState<Garage | null>(null);
  const [query, setQuery] = useState("");

  const filteredGarages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return garages;
    return garages.filter((g) => {
      const managerName = g.managerId
        ? (users.find((u) => u.id === g.managerId)?.name ?? "").toLowerCase()
        : "";
      return (
        g.name.toLowerCase().includes(q) ||
        g.location.toLowerCase().includes(q) ||
        String(g.capacity).includes(q) ||
        managerName.includes(q)
      );
    });
  }, [garages, users, query]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-surface-900">Garages</h3>
          <p className="text-xs sm:text-sm text-slate-400">{garages.length} total garages</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Garage</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, location, manager…"
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
            {filteredGarages.length} result{filteredGarages.length !== 1 ? "s" : ""}
          </span>
          <button type="button" onClick={() => setQuery("")}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Clear search
          </button>
        </div>
      )}

      <GarageList
        garages={filteredGarages}
        onEdit={setEditingGarage}
        onDelete={deleteGarage}
      />

      {showAdd && (
        <AddGarageModal
          onSubmit={addGarage}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editingGarage && (
        <EditGarageModal
          garage={editingGarage}
          onSave={updateGarage}
          onClose={() => setEditingGarage(null)}
        />
      )}
    </div>
  );
}
