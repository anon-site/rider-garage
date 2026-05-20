"use client";

import { useState, useRef, useCallback } from "react";
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  FileJson,
  Sheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  Bike,
  Warehouse,
  ClipboardList,
  Database,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  exportJSON,
  exportExcel,
  exportPDF,
  exportCSV,
  parseImportJSON,
  type DataScope,
  type SiteData,
  type ImportResult,
} from "@/lib/data-io";
import { useDrivers } from "@/contexts/drivers-context";
import { useBikes } from "@/contexts/bikes-context";
import { useUsers, useGarages } from "@/contexts/control-panel-context";
import { useAttendance } from "@/contexts/attendance-context";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type FormatId = "pdf" | "excel" | "csv" | "json";

/* ─────────────────────────────────────────
   Config
───────────────────────────────────────── */
const FORMATS: {
  id: FormatId;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
  ext: string;
}[] = [
  {
    id: "pdf",
    label: "PDF",
    desc: "Printable report",
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    ext: ".pdf",
  },
  {
    id: "excel",
    label: "Excel",
    desc: "Multi-sheet workbook",
    icon: FileSpreadsheet,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    ext: ".xlsx",
  },
  {
    id: "csv",
    label: "Google Sheets",
    desc: "CSV — import to Sheets",
    icon: Sheet,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    ext: ".csv",
  },
  {
    id: "json",
    label: "JSON",
    desc: "Raw structured data",
    icon: FileJson,
    color: "text-violet-600",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    ext: ".json",
  },
];

const SCOPES: { id: DataScope; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Data", icon: Database },
  { id: "drivers", label: "Drivers", icon: Users },
  { id: "bikes", label: "Fleet Bikes", icon: Bike },
  { id: "users", label: "System Users", icon: Users },
  { id: "garages", label: "Garages", icon: Warehouse },
  { id: "attendance", label: "Attendance", icon: ClipboardList },
];

/* ─────────────────────────────────────────
   Small UI atoms
───────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-200/40 text-white">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <h3 className="text-base font-bold text-surface-900">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Toast notification
───────────────────────────────────────── */
type ToastType = "success" | "error" | "info";
function Toast({
  type,
  message,
  onClose,
}: {
  type: ToastType;
  message: string;
  onClose: () => void;
}) {
  const cfg = {
    success: { cls: "bg-emerald-50 ring-emerald-200 text-emerald-800", icon: CheckCircle2, iconCls: "text-emerald-500" },
    error: { cls: "bg-rose-50 ring-rose-200 text-rose-800", icon: AlertTriangle, iconCls: "text-rose-500" },
    info: { cls: "bg-sky-50 ring-sky-200 text-sky-800", icon: Info, iconCls: "text-sky-500" },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-xl px-4 py-3 ring-1 text-sm", cfg.cls)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconCls)} strokeWidth={2} />
      <span className="flex-1 leading-snug">{message}</span>
      <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   EXPORT PANEL
───────────────────────────────────────── */
function ExportPanel({ data }: { data: SiteData }) {
  const [format, setFormat] = useState<FormatId>("excel");
  const [scope, setScope] = useState<DataScope>("all");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);

  const counts: Record<DataScope, number> = {
    all: data.drivers.length + data.bikes.length + data.users.length + data.garages.length + data.attendance.length,
    drivers: data.drivers.length,
    bikes: data.bikes.length,
    users: data.users.length,
    garages: data.garages.length,
    attendance: data.attendance.length,
  };

  async function handleExport() {
    setLoading(true);
    setToast(null);
    try {
      if (format === "json") exportJSON(data, scope);
      else if (format === "excel") await exportExcel(data, scope);
      else if (format === "pdf") await exportPDF(data, scope);
      else if (format === "csv") exportCSV(data, scope);
      setToast({ type: "success", msg: `Exported successfully as ${FORMATS.find((f) => f.id === format)?.label}.` });
    } catch (e) {
      setToast({ type: "error", msg: `Export failed: ${e instanceof Error ? e.message : "Unknown error"}` });
    } finally {
      setLoading(false);
    }
  }

  const selectedFmt = FORMATS.find((f) => f.id === format)!;
  const selectedScope = SCOPES.find((s) => s.id === scope)!;

  return (
    <div className="space-y-6">
      {/* Format selector */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          1 — Choose Format
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const active = format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={cn(
                  "group flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all",
                  active
                    ? `border-brand-400 ${f.bg} shadow-md`
                    : "border-surface-200 bg-white hover:border-brand-200 hover:bg-brand-50/30"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-all",
                    active ? `${f.bg} ${f.ring}` : "bg-surface-100 ring-surface-200"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? f.color : "text-slate-400")} strokeWidth={1.8} />
                </span>
                <div className="text-center">
                  <p className={cn("text-sm font-bold", active ? "text-surface-900" : "text-slate-600")}>
                    {f.label}
                  </p>
                  <p className="text-[11px] text-slate-400">{f.desc}</p>
                </div>
                {active && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope selector */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          2 — Select Data Scope
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCOPES.map((s) => {
            const Icon = s.icon;
            const active = scope === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ring-1",
                  active
                    ? "bg-brand-600 text-white ring-brand-500 shadow-md shadow-brand-200/40"
                    : "bg-white text-slate-600 ring-surface-200 hover:bg-brand-50 hover:ring-brand-200"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-200" : "text-slate-400")} strokeWidth={1.8} />
                <span className="flex-1 text-sm font-semibold">{s.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold",
                    active ? "bg-brand-500 text-white" : "bg-surface-100 text-slate-500"
                  )}
                >
                  {counts[s.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary + action */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface-50 px-5 py-4 ring-1 ring-surface-200">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", selectedFmt.bg, selectedFmt.ring)}>
            <selectedFmt.icon className={cn("h-4 w-4", selectedFmt.color)} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900">
              {selectedFmt.label} · {selectedScope.label}
            </p>
            <p className="text-xs text-slate-400">
              {counts[scope]} record{counts[scope] !== 1 ? "s" : ""} · {selectedFmt.ext}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading || counts[scope] === 0}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all",
            loading || counts[scope] === 0
              ? "bg-surface-200 text-slate-400 cursor-not-allowed"
              : "bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-200/40 active:scale-95"
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? "Exporting…" : "Export Now"}
        </button>
      </div>

      {toast && (
        <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   IMPORT PANEL
───────────────────────────────────────── */
type ImportPanelProps = {
  onImport: (data: Partial<SiteData>) => void;
};

function ImportPanel({ onImport }: ImportPanelProps) {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<Partial<SiteData> | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setConfirmed(false);
    setPendingData(null);
    setResult(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "json") {
      setResult({ ok: false, error: "Only JSON import is currently supported. Export as JSON first, then re-import." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseImportJSON(text);
      setResult(parsed);
      if (parsed.ok && parsed.data) setPendingData(parsed.data);
    };
    reader.readAsText(file);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleConfirm() {
    if (!pendingData) return;
    onImport(pendingData);
    setConfirmed(true);
    setPendingData(null);
  }

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
          dragging
            ? "border-brand-400 bg-brand-50"
            : "border-surface-300 bg-surface-50/60 hover:border-brand-300 hover:bg-brand-50/30"
        )}
      >
        <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={onInputChange} />
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
            dragging ? "bg-brand-100 text-brand-600" : "bg-surface-100 text-slate-400"
          )}
        >
          <Upload className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="font-semibold text-surface-900">
            {dragging ? "Drop to upload" : "Drop file here or click to browse"}
          </p>
          <p className="mt-1 text-sm text-slate-400">Supports JSON export from this system</p>
        </div>
        {fileName && !dragging && (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {fileName}
          </span>
        )}
      </div>

      {/* Parse result */}
      {result && (
        <div
          className={cn(
            "rounded-2xl p-5 ring-1",
            result.ok ? "bg-emerald-50/60 ring-emerald-200" : "bg-rose-50/60 ring-rose-200"
          )}
        >
          {result.ok && result.summary ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={2} />
                <p className="font-semibold text-emerald-800">File parsed successfully</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.summary).map(([key, count]) => (
                  <span key={key} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-surface-800 ring-1 ring-emerald-200">
                    {key}: <span className="text-emerald-700">{count}</span>
                  </span>
                ))}
              </div>
              {confirmed ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  Data imported into current session.
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-1">
                  <p className="flex-1 text-xs text-emerald-700">
                    Importing will replace current in-memory data for the matched categories.
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-200/40"
                  >
                    <Upload className="h-4 w-4" />
                    Confirm Import
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" strokeWidth={2} />
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200 text-sm text-sky-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" strokeWidth={2} />
        <p>
          To import data from Excel or Google Sheets, first export it as JSON from this system, edit the file if needed, then re-import it here.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN SECTION — tabbed Export / Import
───────────────────────────────────────── */
type ActiveTab = "export" | "import";

type ImportExportSectionProps = {
  onImport: (data: Partial<SiteData>) => void;
};

export function ImportExportSection({ onImport }: ImportExportSectionProps) {
  const [tab, setTab] = useState<ActiveTab>("export");
  const { drivers } = useDrivers();
  const { bikes } = useBikes();
  const { users } = useUsers();
  const { garages } = useGarages();
  const { records: attendance } = useAttendance();

  const data: SiteData = { drivers, bikes, users, garages, attendance };

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "export", label: "Export", icon: Download },
    { id: "import", label: "Import", icon: Upload },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 ring-1 ring-white/60">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          icon={tab === "export" ? Download : Upload}
          title="Import & Export"
          subtitle="Transfer data in multiple formats — PDF, Excel, Google Sheets CSV, or JSON"
        />

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-surface-100 p-1 ring-1 ring-surface-200">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  tab === t.id
                    ? "bg-brand-600 text-white shadow-md shadow-brand-200/40"
                    : "text-slate-500 hover:text-surface-900"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-surface-200 pt-6">
        {tab === "export" ? (
          <ExportPanel data={data} />
        ) : (
          <ImportPanel onImport={onImport} />
        )}
      </div>
    </div>
  );
}
