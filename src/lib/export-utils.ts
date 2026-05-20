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
function fmtDate(iso: string) {
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
    Name: d.name,
    Phone: d.phone,
    Status: d.isActive ? "Active" : "Offline",
    Bike: d.bike?.plateNumber ?? "—",
    Orders: d.orders,
    Hours: fmtHours(d.hours),
    Sessions: d.sessions,
    "Avg. Rating": d.rating.toFixed(1),
  }));
  const wsDrivers = XLSX.utils.json_to_sheet(driverRows);
  wsDrivers["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDrivers, "Drivers");

  /* ── Bikes Sheet ── */
  const bikeRows = data.bikes.map((b) => ({
    Plate: b.plateNumber,
    Type: b.bikeType,
    Color: b.color,
    Status: b.status,
    "Driver ID": b.driverId ?? "—",
    "Garage ID": b.garageId ?? "—",
    "Reg. Date": fmtDate(b.registrationDate),
    Defect: b.defectDescription ?? "—",
    Notes: b.notes ?? "—",
  }));
  const wsBikes = XLSX.utils.json_to_sheet(bikeRows);
  wsBikes["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsBikes, "Fleet");

  /* ── Garages Sheet ── */
  const garageRows = data.garageStats.map((g) => ({
    Name: g.name,
    Location: g.location,
    Capacity: g.capacity,
    Drivers: g.driverCount,
    Bikes: g.bikeCount,
    Orders: g.orders,
    "Avg. Rating": g.rating > 0 ? g.rating.toFixed(1) : "—",
  }));
  const wsGarages = XLSX.utils.json_to_sheet(garageRows);
  wsGarages["!cols"] = [{ wch: 22 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsGarages, "Garages");

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
  const wsAtt = XLSX.utils.json_to_sheet(attRows);
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
    head: [["Driver", "Status", "Bike", "Orders", "Hours", "Sessions", "Avg. Rating"]],
    body: data.driverStats.map((d) => [
      d.name,
      d.isActive ? "Active" : "Offline",
      d.bike?.plateNumber ?? "—",
      String(d.orders),
      fmtHours(d.hours),
      String(d.sessions),
      d.rating > 0 ? d.rating.toFixed(1) : "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  if (y > 170) { doc.addPage(); addHeader(doc, pageW, period); y = 30; }

  /* ── 2. Fleet Status ── */
  sectionTitle("Fleet Status");
  autoTable(doc, {
    startY: y,
    head: [["Plate", "Type", "Color", "Status", "Reg. Date", "Defect"]],
    body: data.bikes.map((b) => [
      b.plateNumber,
      b.bikeType,
      b.color,
      b.status,
      fmtDate(b.registrationDate),
      b.defectDescription ?? "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  if (y > 170) { doc.addPage(); addHeader(doc, pageW, period); y = 30; }

  /* ── 3. Garage Summary ── */
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
  });

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
    id: string; name: string; phone: string; isActive: boolean;
    orders: number; hours: number; sessions: number; rating: number;
    bike?: { plateNumber: string; status: string } | undefined;
  }[];
  bikes: {
    id: string; plateNumber: string; bikeType: string; color: string;
    status: string; driverId?: string; garageId?: string;
    registrationDate: string; defectDescription?: string; notes?: string;
  }[];
  garageStats: {
    id: string; name: string; location: string; capacity: number;
    driverCount: number; bikeCount: number; orders: number; rating: number;
  }[];
  filteredRecords: {
    id: string; driverId: string; clockIn: string; clockOut?: string;
    ordersDelivered: number; rating: number; notes?: string;
  }[];
  driverMap: Record<string, string>;
};
