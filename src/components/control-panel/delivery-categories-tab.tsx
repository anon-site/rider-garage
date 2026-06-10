"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Tag, Package, Palette, Hash, ArrowUpDown, Check, X } from "lucide-react";
import { useDeliveryCategories } from "@/contexts/control-panel-context";
import type { DeliveryCategory } from "@/types/delivery-category";

export function DeliveryCategoriesTab() {
  const { deliveryCategories, addDeliveryCategory, updateDeliveryCategory, deleteDeliveryCategory, changeDeliveryCategoryId } = useDeliveryCategories();
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DeliveryCategory>>({});

  const handleEdit = (category: DeliveryCategory) => {
    setEditing(category.id);
    setFormData(category);
  };

  const handleSave = async (id: string) => {
    if (!formData.name) return;
    await updateDeliveryCategory(id, formData as DeliveryCategory);
    setEditing(null);
    setFormData({});
  };

  const handleAdd = async () => {
    if (!formData.name) return;
    const newCategory: DeliveryCategory = {
      id: formData.id || `cat_${Date.now()}`,
      name: formData.name,
      description: formData.description || "",
      color: formData.color || "#6366f1",
      icon: formData.icon || "Package",
      priority: formData.priority ?? 999,
      isActive: formData.isActive !== false
    };
    await addDeliveryCategory(newCategory);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this delivery category?")) {
      await deleteDeliveryCategory(id);
    }
  };

  const handleIdChange = async (id: string, newId: string) => {
    if (!newId || newId === id) return;
    if (confirm("Change ID? This will update all references.")) {
      await changeDeliveryCategoryId(id, newId);
    }
  };

  const sortedCategories = [...deliveryCategories].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  return (
    <div className="space-y-6">
      {/* Add New Category */}
      <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
        <div className="mb-4 flex items-center gap-3">
          <Tag className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-bold text-surface-900">Add New Delivery Category</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Category Name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="text"
            placeholder="Category ID (optional)"
            value={formData.id || ""}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="color"
            value={formData.color || "#6366f1"}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10 w-full rounded-xl border border-surface-200 bg-white px-2 py-1 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="number"
            placeholder="Priority (0=highest)"
            value={formData.priority ?? ""}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 999 })}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="Description (optional)"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="flex-1 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <button
            onClick={handleAdd}
            disabled={!formData.name}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
        <div className="mb-4 flex items-center gap-3">
          <Package className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-bold text-surface-900">Delivery Categories</h3>
          <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-surface-200">
            {deliveryCategories.length} total
          </span>
        </div>
        <div className="space-y-3">
          {sortedCategories.map((category) => (
            <div
              key={category.id}
              className={`rounded-xl border p-4 transition-all ${
                category.isActive !== false
                  ? "border-surface-200 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-60"
              }`}
            >
              {editing === category.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                    />
                    <input
                      type="text"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description"
                      className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color || "#6366f1"}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-8 w-12 rounded-lg border border-surface-200 bg-white px-1 py-0.5 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                      />
                      <input
                        type="number"
                        value={formData.priority ?? ""}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 999 })}
                        placeholder="Priority"
                        className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(category.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold shadow-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-surface-900">{category.name}</h4>
                        <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-surface-200">
                          Priority: {category.priority ?? 999}
                        </span>
                        {category.isActive === false && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{category.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {category.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          {category.color}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUpDown className="h-3 w-3" />
                          Priority {category.priority ?? 999}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-surface-200"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleIdChange(category.id, prompt("New ID:", category.id) || category.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-surface-200"
                    >
                      <Hash className="h-3.5 w-3.5" />
                      ID
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-600 transition-all hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {deliveryCategories.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-500">No delivery categories yet</p>
              <p className="text-xs text-slate-400">Add your first category above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
