/**
 * src/lib/export-utils.ts
 * CSV and PDF export utilities for all data sections.
 */

import jsPDF from 'jspdf';
import type { Client, Website, Payment, Task, Reminder } from './types';

// ── CSV helpers ───────────────────────────────────────────────────────────────

function toCsvRow(cells: (string | number | boolean | undefined | null)[]): string {
  return cells
    .map(c => {
      const s = String(c ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(',');
}

function downloadCsv(filename: string, rows: string[]): void {
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Clients CSV ───────────────────────────────────────────────────────────────

export function exportClientsCsv(clients: Client[]): void {
  const headers = toCsvRow([
    'ID','Business Name','Contact Name','Email','Phone','Industry','Business Type',
    'Status','City','Country','Currency','Payment Terms','Preferred Payment','VAT Enabled',
    'Account Manager','Tags','Created At'
  ]);
  const rows = clients.map(c => toCsvRow([
    c.id, c.businessName, c.name, c.email, c.phone, c.industry, c.businessType,
    c.status, c.city, c.country, c.currency, c.paymentTerms, c.preferredPayment,
    c.vatEnabled ? 'Yes' : 'No', c.accountManager, c.tags, c.createdAt
  ]));
  downloadCsv(`TGNE-Clients-${today()}.csv`, [headers, ...rows]);
}

// ── Websites CSV ──────────────────────────────────────────────────────────────

export function exportWebsitesCsv(websites: Website[], clients: Client[]): void {
  const headers = toCsvRow([
    'Domain','Client','Platform','Hosting Provider','Project Price','Payment Status',
    'Date Created','Expiry Date','URL'
  ]);
  const rows = websites.map(w => {
    const client = clients.find(c => c.id === w.clientId);
    return toCsvRow([
      w.domainName, client?.businessName ?? w.clientId, w.platform, w.hostingProvider,
      w.projectPrice, w.paymentStatus, w.dateCreated, w.expiryDate ?? '', w.url
    ]);
  });
  downloadCsv(`TGNE-Websites-${today()}.csv`, [headers, ...rows]);
}

// ── Payments CSV ──────────────────────────────────────────────────────────────

export function exportPaymentsCsv(payments: Payment[], clients: Client[]): void {
  const headers = toCsvRow([
    'Invoice #','Client','Amount','Status','Payment Date','Description','Created At'
  ]);
  const rows = payments.map(p => {
    const client = clients.find(c => c.id === p.clientId);
    return toCsvRow([
      p.invoiceNumber, client?.businessName ?? p.clientId, p.amount,
      p.status, p.paymentDate, p.description, p.createdAt
    ]);
  });
  downloadCsv(`TGNE-Invoices-${today()}.csv`, [headers, ...rows]);
}

// ── Tasks CSV ─────────────────────────────────────────────────────────────────

export function exportTasksCsv(tasks: Task[], clients: Client[]): void {
  const headers = toCsvRow(['Client','Description','Status','Due Date']);
  const rows = tasks.map(t => {
    const client = clients.find(c => c.id === t.clientId);
    return toCsvRow([client?.businessName ?? t.clientId, t.description, t.status, t.dueDate]);
  });
  downloadCsv(`TGNE-Tasks-${today()}.csv`, [headers, ...rows]);
}

// ── Reminders CSV ─────────────────────────────────────────────────────────────

export function exportRemindersCsv(reminders: Reminder[]): void {
  const headers = toCsvRow(['Title','Type','Date','Read','Details']);
  const rows = reminders.map(r => toCsvRow([r.title, r.type, r.date, r.isRead ? 'Yes' : 'No', r.details]));
  downloadCsv(`TGNE-Reminders-${today()}.csv`, [headers, ...rows]);
}

// ── Full Data PDF Report ──────────────────────────────────────────────────────

const P   = [101, 68, 214]  as [number, number, number];
const GR  = [100, 100, 115] as [number, number, number];
const DK  = [20,  20,  30]  as [number, number, number];
const WH  = [255, 255, 255] as [number, number, number];
const LB  = [248, 247, 255] as [number, number, number];

function addSection(
  doc: jsPDF, title: string, headers: string[],
  rows: (string | number)[][], y: number, W: number, MARGIN: number
): number {
  if (y > 240) { doc.addPage(); y = 20; }

  // Section header
  doc.setFillColor(...P);
  doc.rect(MARGIN, y, W - MARGIN * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WH);
  doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5);
  y += 10;

  // Column headers
  const colW = (W - MARGIN * 2) / headers.length;
  doc.setFillColor(...LB);
  doc.rect(MARGIN, y, W - MARGIN * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GR);
  headers.forEach((h, i) => doc.text(h, MARGIN + 3 + i * colW, y + 5));
  y += 8;

  // Data rows
  rows.forEach((row, ri) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFillColor(ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 255 : 248, ri % 2 === 0 ? 255 : 255);
    doc.rect(MARGIN, y, W - MARGIN * 2, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...DK);
    row.forEach((cell, i) => {
      const txt = String(cell ?? '').slice(0, 30);
      doc.text(txt, MARGIN + 3 + i * colW, y + 4.5);
    });
    y += 6;
  });
  return y + 8;
}

export function exportFullReportPdf(
  clients: Client[], websites: Website[], payments: Payment[],
  tasks: Task[], reminders: Reminder[]
): void {
  const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W    = 297;
  const MARGIN = 14;

  // Cover header
  doc.setFillColor(...P);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...WH);
  doc.text('TGNE AGENCY — FULL REPORT', MARGIN, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 190, 255);
  doc.text(`Generated ${new Date().toLocaleString()}`, W - MARGIN, 18, { align: 'right' });

  let y = 38;

  // Clients
  y = addSection(doc, 'Clients', ['Business','Contact','Email','Phone','Status','Location','Revenue (GHS)'],
    clients.map(c => {
      const rev = payments.filter(p => p.clientId === c.id && p.status === 'PAID').reduce((s,p) => s + p.amount, 0);
      return [c.businessName, c.name, c.email ?? '', c.phone ?? '', c.status ?? '', [c.city,c.country].filter(Boolean).join(', '), rev.toLocaleString()];
    }), y, W, MARGIN
  );

  // Websites
  y = addSection(doc, 'Websites', ['Domain','Client','Platform','Hosting','Price (GHS)','Paid','Expires'],
    websites.map(w => {
      const cl = clients.find(c => c.id === w.clientId);
      return [w.domainName, cl?.businessName ?? '', w.platform, w.hostingProvider, w.projectPrice, w.paymentStatus, w.expiryDate ?? '—'];
    }), y, W, MARGIN
  );

  // Payments
  y = addSection(doc, 'Invoices', ['Invoice #','Client','Amount','Status','Date','Description'],
    payments.map(p => {
      const cl = clients.find(c => c.id === p.clientId);
      return [p.invoiceNumber, cl?.businessName ?? '', `GHS ${p.amount.toLocaleString()}`, p.status, p.paymentDate, (p.description || '').slice(0,30)];
    }), y, W, MARGIN
  );

  // Tasks
  y = addSection(doc, 'Tasks', ['Client','Description','Status','Due Date'],
    tasks.map(t => {
      const cl = clients.find(c => c.id === t.clientId);
      return [cl?.businessName ?? '', t.description.slice(0,45), t.status, t.dueDate ?? ''];
    }), y, W, MARGIN
  );

  // Footer on all pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...P);
    doc.rect(0, 202, W, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...WH);
    doc.text('TGNE Agency · Confidential Business Report', MARGIN, 207);
    doc.text(`Page ${i} of ${totalPages}`, W - MARGIN, 207, { align: 'right' });
  }

  doc.save(`TGNE-FullReport-${today()}.pdf`);
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}
