/* ── Export Utilities ── PDF (jspdf) + Excel (xlsx) ─────────────── */

/* ── helpers ── */
function calcHours(clockIn: string, clockOut?: string) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return Math.max(0, (end - start) / 3_600_000);
}
function fmtHours(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h ${mm}m`;
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function nowLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ────────────────────────────────────────────────────────────────
   EXCEL EXPORT
──────────────────────────────────────────────────────────────── */
export async function exportExcel(data: ExportData, period: string) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  /* ── Drivers Sheet ── */
  const driverRows = data.driverStats.map((d) => ({
    ID: d.id,
    Name: d.name,
    Phone: d.phone,
    "App ID": d.appId ?? "—",
    Status: d.isActive ? "Active" : "Offline",
    Bike: d.bike?.plateNumber ?? "—",
    "Delivery Category": d.deliveryCategoryId ? (data.deliveryCategoryMap?.[d.deliveryCategoryId] ?? d.deliveryCategoryId) : "—",
    Orders: d.orders,
    Hours: fmtHours(d.hours),
    Sessions: d.sessions,
    "Avg. Rating": d.rating.toFixed(1),
  }));
  const driverSummary: Record<string, unknown> = {};
  Object.keys(driverRows[0] ?? {}).forEach((k, i) => { driverSummary[k] = i === 0 ? `Total: ${driverRows.length}` : ""; });
  const wsDrivers = XLSX.utils.json_to_sheet(driverRows.length ? [...driverRows, driverSummary] : driverRows);
  wsDrivers["!cols"] = [{ wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDrivers, "Drivers");

  /* ── Bikes Sheet ── */
  const bikeRows = data.bikes.map((b) => ({
    Plate: b.plateNumber,
    Type: b.bikeType,
    Color: b.color ?? "—",
    Status: b.status,
    Driver: b.driverId ? (data.driverMap[b.driverId] ?? b.driverId) : "—",
    Garage: b.garageId ? (data.garageMap?.[b.garageId] ?? b.garageId) : "—",
    "Reg. Date": fmtDate(b.registrationDate),
    Defect: b.defectDescription ?? "—",
    Notes: b.notes ?? "—",
  }));
  const bikeSummary: Record<string, unknown> = {};
  Object.keys(bikeRows[0] ?? {}).forEach((k, i) => { bikeSummary[k] = i === 0 ? `Total: ${bikeRows.length}` : ""; });
  const wsBikes = XLSX.utils.json_to_sheet(bikeRows.length ? [...bikeRows, bikeSummary] : bikeRows);
  wsBikes["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsBikes, "Fleet");

  /* ── Garages Sheet ── */
  if (data.garageStats) {
    const garageRows = data.garageStats.map((g) => ({
      Name: g.name,
      Location: g.location,
      Capacity: g.capacity,
      Drivers: g.driverCount,
      Bikes: g.bikeCount,
      Orders: g.orders,
      "Avg. Rating": g.rating > 0 ? g.rating.toFixed(1) : "—",
    }));
    const garageSummary: Record<string, unknown> = {};
    Object.keys(garageRows[0] ?? {}).forEach((k, i) => { garageSummary[k] = i === 0 ? `Total: ${garageRows.length}` : ""; });
    const wsGarages = XLSX.utils.json_to_sheet(garageRows.length ? [...garageRows, garageSummary] : garageRows);
    wsGarages["!cols"] = [{ wch: 22 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsGarages, "Garages");
  }

  /* ── Attendance Sheet ── */
  const attRows = data.filteredRecords.map((r) => {
    const driver = data.driverMap[r.driverId] ?? r.driverId;
    const hours = calcHours(r.clockIn, r.clockOut);
    return {
      Driver: driver,
      "Clock In": fmtDate(r.clockIn),
      "Clock Out": r.clockOut ? fmtDate(r.clockOut) : "Active",
      Hours: fmtHours(hours),
      Orders: r.ordersDelivered,
      Rating: r.rating,
      Notes: r.notes ?? "—",
    };
  });
  const attSummary: Record<string, unknown> = {};
  Object.keys(attRows[0] ?? {}).forEach((k, i) => { attSummary[k] = i === 0 ? `Total: ${attRows.length}` : ""; });
  const wsAtt = XLSX.utils.json_to_sheet(attRows.length ? [...attRows, attSummary] : attRows);
  wsAtt["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsAtt, "Attendance");

  XLSX.writeFile(wb, `RiderGarage_Report_${period}_${nowLabel().replace(/[/:, ]/g, "-")}.xlsx`);
}

/* ────────────────────────────────────────────────────────────────
   PDF EXPORT
──────────────────────────────────────────────────────────────── */
export async function exportPDF(data: ExportData, period: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  /* ── Header band ── */
  doc.setFillColor(30, 41, 59);   // surface-900 equivalent
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Rider Garage — Report", 14, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "All time"}   ·   Generated: ${nowLabel()}`, pageW - 14, 14, { align: "right" });

  let y = 30;

  /* ── Helpers ── */
  function sectionTitle(title: string) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, y);
    y += 6;
  }

  /* ── 1. Driver Performance ── */
  sectionTitle("Driver Performance");
  autoTable(doc, {
    startY: y,
    head: [["ID", "Driver", "App ID", "Status", "Bike", "Delivery Category", "Orders", "Hours", "Sessions", "Avg. Rating"]],
    body: data.driverStats.map((d) => [
      d.id,
      d.name,
      d.appId ?? "—",
      d.isActive ? "Active" : "Offline",
      d.bike?.plateNumber ?? "—",
      d.deliveryCategoryId ? (data.deliveryCategoryMap?.[d.deliveryCategoryId] ?? d.deliveryCategoryId) : "—",
      String(d.orders),
      fmtHours(d.hours),
      String(d.sessions),
      d.rating > 0 ? d.rating.toFixed(1) : "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    foot: [[`Total: ${data.driverStats.length}`, "", "", "", "", "", "", "", "", ""]],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 8 },
    showFoot: "lastPage",
  });
  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 12;
  if (y > 170) { doc.addPage(); addHeader(doc, pageW, period); y = 30; }

  /* ── 2. Fleet Status ── */
  sectionTitle("Fleet Status");
  autoTable(doc, {
    startY: y,
    head: [["Plate", "Type", "Color", "Status", "Driver", "Reg. Date", "Defect"]],
    body: data.bikes.map((b) => [
      b.plateNumber,
      b.bikeType,
      b.color ?? "—",
      b.status,
      b.driverId ? (data.driverMap[b.driverId] ?? b.driverId) : "—",
      fmtDate(b.registrationDate),
      b.defectDescription ?? "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    foot: [[`Total: ${data.bikes.length}`, "", "", "", "", "", ""]],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 8 },
    showFoot: "lastPage",
  });
  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 12;
  if (y > 170) { doc.addPage(); addHeader(doc, pageW, period); y = 30; }

  /* ── 3. Garage Summary ── */
  if (data.garageStats) {
    sectionTitle("Garage Summary");
    autoTable(doc, {
      startY: y,
      head: [["Garage", "Location", "Capacity", "Drivers", "Bikes", "Orders", "Avg. Rating"]],
      body: data.garageStats.map((g) => [
        g.name,
        g.location,
        String(g.capacity),
        String(g.driverCount),
        String(g.bikeCount),
        String(g.orders),
        g.rating > 0 ? g.rating.toFixed(1) : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      foot: [[`Total: ${data.garageStats!.length}`, "", "", "", "", "", ""]],
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 8 },
      showFoot: "lastPage",
    });
  }

  /* ── Page numbers ── */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pages}`, pageW - 14, doc.internal.pageSize.getHeight() - 6, { align: "right" });
    doc.text("Rider Garage Management System", 14, doc.internal.pageSize.getHeight() - 6);
  }

  doc.save(`RiderGarage_Report_${period}_${nowLabel().replace(/[/:, ]/g, "-")}.pdf`);
}

function addHeader(doc: InstanceType<typeof import("jspdf").default>, pageW: number, period: string) {
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Rider Garage — Report (cont.)", 14, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${period}`, pageW - 14, 14, { align: "right" });
}

/* ── Shared data shape ── */
export type ExportData = {
  driverStats: {
    id: string; name: string; phone: string; appId?: string; isActive: boolean;
    orders: number; hours: number; sessions: number; rating: number;
    bike?: { plateNumber: string; status: string } | undefined;
    deliveryCategoryId?: string;
  }[];
  bikes: {
    id: string; plateNumber: string; bikeType: string; color?: string | null;
    status: string; driverId?: string | null; garageId?: string | null;
    registrationDate?: string | null; defectDescription?: string | null; notes?: string | null;
  }[];
  garageStats?: {
    id: string; name: string; location: string; capacity: number;
    driverCount: number; bikeCount: number; orders: number; rating: number;
  }[];
  filteredRecords: {
    id: string; driverId: string; clockIn: string; clockOut?: string;
    ordersDelivered: number; rating: number; notes?: string;
  }[];
  driverMap: Record<string, string>;
  garageMap?: Record<string, string>;
};
