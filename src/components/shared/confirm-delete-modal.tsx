"use client";

import { useState } from "react";
import { X, AlertTriangle, Lock } from "lucide-react";
import { useModalBehavior } from "@/hooks/use-modal";
import { authFetch } from "@/lib/auth-fetch";

type ConfirmDeleteModalProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({ title, description, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  useModalBehavior(true, onCancel);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleConfirm() {
    setVerifying(true);
    setError("");

    try {
      const response = await authFetch("/api/auth/verify-admin", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "Incorrect admin password.");
        setPassword("");
        return;
      }

      onConfirm();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-surface-200">
        <div className="flex items-center gap-3 border-b border-surface-200 bg-red-50 px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-900">{title}</h3>
            <p className="text-sm text-red-700">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            Enter your admin password to confirm this action.
          </p>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="Admin password"
              className="w-full rounded-xl border border-surface-200 py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-200 bg-surface-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={verifying || !password}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
