/**
 * src/lib/generate-invoice-pdf.ts
 * Branded TGNE invoice PDF generator using jsPDF.
 * Generates a professional, styled PDF invoice and triggers browser download.
 */

import jsPDF from 'jspdf';
import type { Payment, Client } from './types';

const PRIMARY   = [101, 68, 214] as [number, number, number]; // purple #6544D6
const DARK      = [15,  15,  20] as [number, number, number];
const GRAY      = [120, 120, 135] as [number, number, number];
const LIGHT_BG  = [248, 247, 255] as [number, number, number];
const GREEN     = [16, 168, 100]  as [number, number, number];
const AMBER     = [202, 138, 4]   as [number, number, number];
const WHITE     = [255, 255, 255] as [number, number, number];
const BORDER    = [220, 215, 240] as [number, number, number];

export function generateInvoicePDF(payment: Payment, client: Client): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W    = 210;
  const MARGIN = 18;
  const COL2   = W - MARGIN;

  // ── Header band ───────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 42, 'F');

  // TGNE wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  doc.text('TGNE', MARGIN, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 190, 255);
  doc.text('PREMIUM WEB SOLUTIONS', MARGIN, 26);

  // Invoice label (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('INVOICE', COL2, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 190, 255);
  doc.text(payment.invoiceNumber || `INV-${payment.id.slice(0, 6).toUpperCase()}`, COL2, 25, { align: 'right' });

  // Status badge
  const isPaid = payment.status === 'PAID';
  doc.setFillColor(...(isPaid ? GREEN : AMBER));
  doc.roundedRect(COL2 - 28, 29, 28, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(isPaid ? '✓  PAID' : '⧗  PENDING', COL2 - 14, 34.5, { align: 'center' });

  // ── Meta row ──────────────────────────────────────────────────────────────
  let y = 54;
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, 46, W, 20, 'F');

  const metaItems = [
    { label: 'Issue Date',   value: payment.paymentDate },
    { label: 'Invoice #',    value: payment.invoiceNumber || `INV-${payment.id.slice(0,6).toUpper}` },
    { label: 'Reference ID', value: payment.id.slice(0, 8).toUpperCase() },
    { label: 'Currency',     value: client.currency || 'GHS' },
  ];
  const colW = (W - MARGIN * 2) / metaItems.length;
  metaItems.forEach((item, i) => {
    const x = MARGIN + i * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(item.label.toUpperCase(), x, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(item.value || '—', x, 59);
  });

  // ── From / To block ───────────────────────────────────────────────────────
  y = 78;

  // FROM
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('FROM', MARGIN, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text('TGNE Agency', MARGIN, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('Accra, Ghana', MARGIN, y + 12);
  doc.text('hello@tgne.agency', MARGIN, y + 18);

  // TO
  const toX = W / 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('BILLED TO', toX, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(client.businessName || 'Client', toX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  if (client.name)     doc.text(client.name,  toX, y + 12);
  if (client.email)    doc.text(client.email, toX, y + 18);
  if (client.phone)    doc.text(client.phone, toX, y + 24);
  const loc = [client.city, client.country].filter(Boolean).join(', ');
  if (loc)             doc.text(loc, toX, y + 30);

  // Divider
  y = 118;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, COL2, y);

  // ── Line items table ──────────────────────────────────────────────────────
  y += 10;
  // Table header
  doc.setFillColor(...PRIMARY);
  doc.rect(MARGIN, y - 5, COL2 - MARGIN, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('DESCRIPTION', MARGIN + 4, y + 0.5);
  doc.text('AMOUNT', COL2 - 4, y + 0.5, { align: 'right' });

  y += 12;
  // Row
  doc.setFillColor(252, 250, 255);
  doc.rect(MARGIN, y - 5, COL2 - MARGIN, 14, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y - 5, COL2 - MARGIN, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  const desc = payment.description || 'Web Development & Digital Services';
  const descLines = doc.splitTextToSize(desc, 110);
  doc.text(descLines, MARGIN + 4, y + 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `${client.currency || 'GHS'} ${payment.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
    COL2 - 4,
    y + 4,
    { align: 'right' }
  );

  y += 22;

  // VAT row (if applicable)
  const vatEnabled = client.vatEnabled;
  let vatAmount = 0;
  if (vatEnabled) {
    vatAmount = payment.amount * 0.15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Subtotal', COL2 - 52, y);
    doc.text(
      `${client.currency || 'GHS'} ${payment.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
      COL2 - 4, y, { align: 'right' }
    );
    y += 7;
    doc.text('VAT (15%)', COL2 - 52, y);
    doc.text(
      `${client.currency || 'GHS'} ${vatAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
      COL2 - 4, y, { align: 'right' }
    );
    y += 7;
    doc.setDrawColor(...BORDER);
    doc.line(COL2 - 60, y - 2, COL2, y - 2);
  }

  // ── Total box ─────────────────────────────────────────────────────────────
  const total = payment.amount + vatAmount;
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(COL2 - 72, y, 72, 16, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(200, 190, 255);
  doc.text('TOTAL DUE', COL2 - 68, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(
    `${client.currency || 'GHS'} ${total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
    COL2 - 4, y + 10, { align: 'right' }
  );

  // ── Payment details ───────────────────────────────────────────────────────
  y += 28;
  if (client.preferredPayment || client.paymentTerms) {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(MARGIN, y, 90, 26, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);
    doc.text('PAYMENT DETAILS', MARGIN + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(`Method: ${client.preferredPayment || 'Mobile Money'}`, MARGIN + 4, y + 14);
    doc.text(`Terms:  ${client.paymentTerms || 'Due on Receipt'}`, MARGIN + 4, y + 21);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 272, W, 25, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('Thank you for your business!', W / 2, 280, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 190, 255);
  doc.text('TGNE Agency · Accra, Ghana · hello@tgne.agency', W / 2, 287, { align: 'center' });
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W / 2, 292, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `TGNE-${payment.invoiceNumber || payment.id.slice(0,8)}-${client.businessName.replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
}
