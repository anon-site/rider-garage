import type { Driver } from "@/types/driver";
import type { Bike } from "@/types/bike";
import type { User } from "@/types/user";
import type { Garage } from "@/types/garage";
import type { AttendanceRecord } from "@/types/attendance";

/* ───────────────────────────────────────────
   Types
─────────────────────────────────────────── */
export type DataScope = "drivers" | "bikes" | "users" | "garages" | "attendance" | "all";

export type SiteData = {
  drivers: Driver[];
  bikes: Bike[];
  users: User[];
  garages: Garage[];
  attendance: AttendanceRecord[];
};

export type ExtendedSiteData = SiteData & {
  deliveryCategories?: Array<{ id: string; name: string }>;
};

/* ───────────────────────────────────────────
   Helpers
─────────────────────────────────────────── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

/* ───────────────────────────────────────────
   Flat-row converters (per entity)
─────────────────────────────────────────── */
function driversToRows(drivers: Driver[], bikeMap?: Record<string, string>, deliveryCategoryMap?: Record<string, string>) {
  return [...drivers]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((d) => ({
      ID: d.id,
      Name: d.name,
      Phone: d.phone,
      "App ID": d.appId ?? "",
      "Join Date": d.joinDate ?? "",
      "Bike Plate": d.bikeId ? (bikeMap?.[d.bikeId] ?? d.bikeId) : "",
      "Preferred Bike Type": d.preferredBikeType ?? "",
      "Delivery Category": d.deliveryCategoryIds && d.deliveryCategoryIds.length > 0 
        ? d.deliveryCategoryIds.map(id => deliveryCategoryMap?.[id] ?? id).join(", ") 
        : "",
    }));
}

function bikesToRows(bikes: Bike[], driverMap?: Record<string, string>) {
  return [...bikes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => ({
      ID: b.id,
      "Plate Number": b.plateNumber,
      Color: b.color,
      "Bike Type": b.bikeType,
      Status: b.status,
      "Driver": b.driverId ? (driverMap?.[b.driverId] ?? b.driverId) : "",
      "Registration Date": b.registrationDate,
      "Defect Description": b.defectDescription ?? "",
      Notes: b.notes ?? "",
    }));
}

function usersToRows(users: User[]) {
  return [...users]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((u) => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Phone: u.phone,
      Role: u.role,
      "Garage ID": u.garageId ?? "",
    }));
}

function garagesToRows(garages: Garage[]) {
  return [...garages]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((g) => ({
      ID: g.id,
      Name: g.name,
      Location: g.location,
      Capacity: g.capacity,
      "Manager ID": g.managerId ?? "",
    }));
}

function attendanceToRows(records: AttendanceRecord[]) {
  return [...records]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => ({
      ID: r.id,
      "Driver ID": r.driverId,
      "Clock In": r.clockIn,
      "Clock Out": r.clockOut ?? "",
      "Orders Delivered": r.ordersDelivered,
      Rating: r.rating,
      Notes: r.notes ?? "",
    }));
}

/* ───────────────────────────────────────────
   Sort helpers for consistent export ordering
─────────────────────────────────────────── */
function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

/* ───────────────────────────────────────────
   JSON Export
─────────────────────────────────────────── */
export function exportJSON(data: SiteData, scope: DataScope) {
  const sortedData: SiteData = {
    drivers: sortById(data.drivers),
    bikes: sortById(data.bikes),
    users: sortById(data.users),
    garages: sortById(data.garages),
    attendance: sortById(data.attendance),
  };
  const payload = scope === "all" ? sortedData : { [scope]: sortedData[scope] };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, `rider-garage-${scope}-${timestamp()}.json`);
}

/* ───────────────────────────────────────────
   Excel Export (multi-sheet)
─────────────────────────────────────────── */
export async function exportExcel(data: SiteData, scope: DataScope) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const bikeMap = Object.fromEntries(data.bikes.map((b) => [b.id, b.plateNumber]));
  const driverMap = Object.fromEntries(data.drivers.map((d) => [d.id, d.name]));
  
  // Create delivery category map for drivers export
  const extendedData = data as ExtendedSiteData;
  const deliveryCategories = extendedData.deliveryCategories || [];
  const deliveryCategoryMap = Object.fromEntries(deliveryCategories.map((cat) => [cat.id, cat.name]));

  function addSheet(name: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    const summaryRow: Record<string, unknown> = {};
    const keys = Object.keys(rows[0]);
    keys.forEach((k, i) => { summaryRow[k] = i === 0 ? `Total: ${rows.length}` : ""; });
    const allRows = [...rows, summaryRow];
    const ws = XLSX.utils.json_to_sheet(allRows);
    const colWidths = keys.map((key) => ({
      wch: Math.max(key.length, ...allRows.map((r) => String(r[key] ?? "").length)) + 2,
    }));
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  if (scope === "all" || scope === "drivers") addSheet("Drivers", driversToRows(data.drivers, bikeMap, deliveryCategoryMap));
  if (scope === "all" || scope === "bikes") addSheet("Bikes", bikesToRows(data.bikes, driverMap));
  if (scope === "all" || scope === "users") addSheet("Users", usersToRows(data.users));
  if (scope === "all" || scope === "garages") addSheet("Garages", garagesToRows(data.garages));
  if (scope === "all" || scope === "attendance") addSheet("Attendance", attendanceToRows(data.attendance));

  XLSX.writeFile(wb, `rider-garage-${scope}-${timestamp()}.xlsx`);
}

/* ───────────────────────────────────────────
   PDF Export
─────────────────────────────────────────── */
export async function exportPDF(data: SiteData, scope: DataScope) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let isFirst = true;

  // Create delivery category map for drivers export
  const extendedData = data as ExtendedSiteData;
  const deliveryCategories = extendedData.deliveryCategories || [];
  const deliveryCategoryMap = Object.fromEntries(deliveryCategories.map((cat) => [cat.id, cat.name]));

  function addTable(title: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    if (!isFirst) doc.addPage();
    isFirst = false;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 118, 110);
    doc.text(title, 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total: ${rows.length}  ·  Exported ${new Date().toLocaleString()}`, pageW - 14, 16, { align: "right" });

    const head = [Object.keys(rows[0])];
    const body = rows.map((r) => Object.values(r).map(String));

    autoTable(doc, {
      head,
      body,
      startY: 22,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.2,
      margin: { left: 14, right: 14 },
      foot: [[`Total: ${rows.length}`, ...Array(head[0].length - 1).fill("")]],
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 8 },
      showFoot: "lastPage",
    });
  }

  const bikeMapPdf = Object.fromEntries(data.bikes.map((b) => [b.id, b.plateNumber]));
  const driverMapPdf = Object.fromEntries(data.drivers.map((d) => [d.id, d.name]));

  if (scope === "all" || scope === "drivers") addTable("Drivers", driversToRows(data.drivers, bikeMapPdf, deliveryCategoryMap));
  if (scope === "all" || scope === "bikes") addTable("Fleet Bikes", bikesToRows(data.bikes, driverMapPdf));
  if (scope === "all" || scope === "users") addTable("System Users", usersToRows(data.users));
  if (scope === "all" || scope === "garages") addTable("Garages", garagesToRows(data.garages));
  if (scope === "all" || scope === "attendance") addTable("Attendance", attendanceToRows(data.attendance));

  doc.save(`rider-garage-${scope}-${timestamp()}.pdf`);
}

/* ───────────────────────────────────────────
   Google Sheets CSV Export
─────────────────────────────────────────── */
function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = Object.keys(rows[0]).map(escape).join(",");
  const body = rows.map((r) => Object.values(r).map(escape).join(",")).join("\n");
  return `${header}\n${body}`;
}

export function exportCSV(data: SiteData, scope: DataScope) {
  const sections: { name: string; rows: Record<string, unknown>[] }[] = [];

  const bikeMap = Object.fromEntries(data.bikes.map((b) => [b.id, b.plateNumber]));
  const driverMap = Object.fromEntries(data.drivers.map((d) => [d.id, d.name]));

  if (scope === "all" || scope === "drivers") sections.push({ name: "Drivers", rows: driversToRows(data.drivers, bikeMap) });
  if (scope === "all" || scope === "bikes") sections.push({ name: "Bikes", rows: bikesToRows(data.bikes, driverMap) });
  if (scope === "all" || scope === "users") sections.push({ name: "Users", rows: usersToRows(data.users) });
  if (scope === "all" || scope === "garages") sections.push({ name: "Garages", rows: garagesToRows(data.garages) });
  if (scope === "all" || scope === "attendance") sections.push({ name: "Attendance", rows: attendanceToRows(data.attendance) });

  let csv = "";
  for (const s of sections) {
    csv += `### ${s.name} ###\n${rowsToCsv(s.rows)}\n\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `rider-garage-${scope}-${timestamp()}.csv`);
}

/* ───────────────────────────────────────────
   JSON Import (parse + validate structure)
─────────────────────────────────────────── */
export type ImportResult = {
  ok: boolean;
  data?: Partial<SiteData>;
  error?: string;
  summary?: Record<string, number>;
};

export function parseImportJSON(text: string): ImportResult {
  try {
    const parsed = JSON.parse(text);
    const result: Partial<SiteData> = {};
    const summary: Record<string, number> = {};

    if (Array.isArray(parsed.drivers)) { result.drivers = parsed.drivers; summary.drivers = parsed.drivers.length; }
    if (Array.isArray(parsed.bikes)) { result.bikes = parsed.bikes; summary.bikes = parsed.bikes.length; }
    if (Array.isArray(parsed.users)) { result.users = parsed.users; summary.users = parsed.users.length; }
    if (Array.isArray(parsed.garages)) { result.garages = parsed.garages; summary.garages = parsed.garages.length; }
    if (Array.isArray(parsed.attendance)) { result.attendance = parsed.attendance; summary.attendance = parsed.attendance.length; }

    if (Object.keys(result).length === 0) {
      return { ok: false, error: "No recognisable data found in JSON file." };
    }

    return { ok: true, data: result, summary };
  } catch {
    return { ok: false, error: "Invalid JSON format. Please check your file." };
  }
}

export async function parseImportExcel(arrayBuffer: ArrayBuffer): Promise<ImportResult> {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const result: Partial<SiteData> = {};
    const summary: Record<string, number> = {};

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    function getSheetRows(sheetName: string): any[] {
      const ws = wb.Sheets[sheetName];
      if (!ws) return [];
      return XLSX.utils.sheet_to_json(ws);
    }

    // Drivers
    const driversRows = getSheetRows("Drivers");
    if (driversRows.length > 0) {
      const rows = driversRows.filter(r => r.ID && !String(r.ID).startsWith("Total:"));
      const drivers: Driver[] = rows.map((r) => ({
        id: String(r.ID || ""),
        name: String(r.Name || ""),
        phone: String(r.Phone || ""),
        appId: String(r["App ID"] || ""),
        joinDate: r["Join Date"] ? String(r["Join Date"]) : undefined,
        preferredBikeType: r["Preferred Bike Type"] && (String(r["Preferred Bike Type"]).toLowerCase().includes("motor") || String(r["Preferred Bike Type"]) === "electric_motorcycle") 
          ? "electric_motorcycle" 
          : r["Preferred Bike Type"] 
          ? "electric_bicycle" 
          : undefined,
        deliveryCategoryIds: r["Delivery Category"] ? String(r["Delivery Category"]).split(", ").filter(Boolean) : [],
        bikeId: r["Bike ID"] ? String(r["Bike ID"]) : undefined,
        garageId: r["Garage ID"] ? String(r["Garage ID"]) : undefined,
      }));
      result.drivers = drivers;
      summary.drivers = drivers.length;
    }

    // Bikes
    const bikesRows = getSheetRows("Bikes");
    if (bikesRows.length > 0) {
      const rows = bikesRows.filter(r => r.ID && !String(r.ID).startsWith("Total:"));
      const bikes: Bike[] = rows.map((r) => {
        const rawType = String(r["Bike Type"] || "").toLowerCase();
        const bikeType = rawType.includes("motor") || rawType === "electric_motorcycle" ? "electric_motorcycle" : "electric_bicycle";
        
        const rawStatus = String(r.Status || "").toLowerCase();
        const status = rawStatus.includes("defect") || rawStatus === "defective" ? "defective" : rawStatus.includes("maint") || rawStatus === "maintenance" ? "maintenance" : "good";
        
        return {
          id: String(r.ID || ""),
          plateNumber: String(r["Plate Number"] || ""),
          color: r.Color ? String(r.Color) : null,
          bikeType,
          status,
          registrationDate: r["Registration Date"] ? String(r["Registration Date"]) : null,
          defectDescription: r["Defect Description"] ? String(r["Defect Description"]) : null,
          notes: r.Notes ? String(r.Notes) : null,
          garageId: r["Garage ID"] ? String(r["Garage ID"]) : null,
          driverId: r["Driver ID"] ? String(r["Driver ID"]) : null,
        };
      });
      result.bikes = bikes;
      summary.bikes = bikes.length;
    }

    // Users
    const usersRows = getSheetRows("Users");
    if (usersRows.length > 0) {
      const rows = usersRows.filter(r => r.ID && !String(r.ID).startsWith("Total:"));
      const users: User[] = rows.map((r) => {
        const rawRole = String(r.Role || "observer").toLowerCase();
        const role = rawRole.includes("admin") ? "admin" : rawRole.includes("super") ? "supervisor" : rawRole.includes("manag") || rawRole === "garage" ? "garage" : "observer";
        return {
          id: String(r.ID || ""),
          name: String(r.Name || ""),
          email: String(r.Email || ""),
          phone: String(r.Phone || ""),
          role,
          garageId: r["Garage ID"] ? String(r["Garage ID"]) : undefined,
          username: String(r.Username || r.Name || "").toLowerCase().replace(/\s+/g, ""),
          password: String(r.Password || "123456"),
          customPermissions: null,
        };
      });
      result.users = users;
      summary.users = users.length;
    }

    // Garages
    const garagesRows = getSheetRows("Garages");
    if (garagesRows.length > 0) {
      const rows = garagesRows.filter(r => r.ID && !String(r.ID).startsWith("Total:"));
      const garages: Garage[] = rows.map((r) => ({
        id: String(r.ID || ""),
        name: String(r.Name || ""),
        location: String(r.Location || ""),
        capacity: Number(r.Capacity || 0),
        managerId: r["Manager ID"] ? String(r["Manager ID"]) : undefined,
      }));
      result.garages = garages;
      summary.garages = garages.length;
    }

    // Attendance
    const attendanceRows = getSheetRows("Attendance");
    if (attendanceRows.length > 0) {
      const rows = attendanceRows.filter(r => r.ID && !String(r.ID).startsWith("Total:"));
      const attendance: AttendanceRecord[] = rows.map((r) => ({
        id: String(r.ID || ""),
        driverId: String(r["Driver ID"] || ""),
        clockIn: String(r["Clock In"] || ""),
        clockOut: r["Clock Out"] ? String(r["Clock Out"]) : undefined,
        ordersDelivered: Number(r["Orders Delivered"] || 0),
        rating: Number(r.Rating || 0),
        notes: r.Notes ? String(r.Notes) : undefined,
      }));
      result.attendance = attendance;
      summary.attendance = attendance.length;
    }

    if (Object.keys(result).length === 0) {
      return { ok: false, error: "No recognisable data sheets found in Excel file." };
    }

    return { ok: true, data: result, summary };
  } catch (err) {
    return { ok: false, error: `Failed to parse Excel workbook: ${err instanceof Error ? err.message : "Invalid format"}` };
  }
}
