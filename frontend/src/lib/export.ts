import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  format?: (row: T) => string | number;
}

function rowsToObjects<T>(rows: T[], cols: Column<T>[]) {
  return rows.map(r => {
    const out: Record<string, any> = {};
    cols.forEach(c => { out[c.label] = c.format ? c.format(r) : (r as any)[c.key as string]; });
    return out;
  });
}

export function exportCSV<T>(filename: string, rows: T[], cols: Column<T>[]) {
  const headers = cols.map(c => c.label);
  const lines = [
    headers.join(';'),
    ...rows.map(r => cols.map(c => {
      const v = c.format ? c.format(r) : (r as any)[c.key as string];
      const s = String(v ?? '').replace(/"/g, '""');
      return /[;\n"]/.test(s) ? `"${s}"` : s;
    }).join(';')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  download(blob, `${filename}.csv`);
}

export function exportXLSX<T>(filename: string, rows: T[], cols: Column<T>[], sheetName = 'Dados') {
  const data = rowsToObjects(rows, cols);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF<T>(filename: string, title: string, rows: T[], cols: Column<T>[]) {
  const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · Rendari`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [cols.map(c => c.label)],
    body: rows.map(r => cols.map(c => {
      const v = c.format ? c.format(r) : (r as any)[c.key as string];
      return String(v ?? '');
    })),
    headStyles: { fillColor: [61, 111, 216], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { top: 28 },
  });
  doc.save(`${filename}.pdf`);
}

export function exportJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  download(blob, `${filename}.json`);
}

function download(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
