/**
 * src/lib/generate-invoice-pdf.ts
 * Generates a clean, professional invoice PDF using jsPDF.
 * Runs entirely client-side — no server required.
 */

import jsPDF from 'jspdf';
import { Payment, Client } from './types';

export function generateInvoicePDF(payment: Payment, client: Client) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;

  // ── Colours ──────────────────────────────────────────────────────────────
  const black   = '#0a0a0a';
  const gray    = '#6b7280';
  const light   = '#f3f4f6';
  const accent  = '#ea580c'; // orange-600

  // ── Header bar ───────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('TGNE', margin, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Premium Web Solutions', margin, 29);

  // Invoice label top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE', W - margin, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(payment.invoiceNumber, W - margin, 25, { align: 'right' });

  // ── Meta block ────────────────────────────────────────────────────────────
  let y = 52;

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('BILL TO', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(black);
  doc.text(client.businessName, margin, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(gray);
  if (client.email) doc.text(client.email, margin, y + 13);
  if (client.phone) doc.text(client.phone, margin, y + 19);
  if (client.location) doc.text(client.location, margin, y + 25);

  // Dates — right side
  const rightX = W - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('INVOICE DATE', rightX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(black);
  doc.text(payment.paymentDate, rightX, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('STATUS', rightX, y + 17, { align: 'right' });

  // Status badge
  const statusText = payment.status === 'PAID' ? 'PAID' : 'PENDING';
  const statusColor = payment.status === 'PAID' ? [22, 163, 74] : [217, 119, 6];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  const badgeW = 22;
  const badgeX = rightX - badgeW;
  doc.roundedRect(badgeX, y + 20, badgeW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, rightX - badgeW / 2, y + 25, { align: 'center' });

  // ── Divider ───────────────────────────────────────────────────────────────
  y += 38;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);

  // ── Services table ────────────────────────────────────────────────────────
  y += 10;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, W - margin * 2, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('DESCRIPTION', margin + 4, y + 7);
  doc.text('AMOUNT', W - margin - 4, y + 7, { align: 'right' });

  // Table row
  y += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, W - margin * 2, 14, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, W - margin * 2, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(black);

  const descText = payment.description || 'Web Development Services';
  const maxWidth = W - margin * 2 - 50;
  const lines = doc.splitTextToSize(descText, maxWidth);
  doc.text(lines[0], margin + 4, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`GHS ${payment.amount.toLocaleString()}`, W - margin - 4, y + 9, { align: 'right' });

  // ── Total block ───────────────────────────────────────────────────────────
  y += 24;
  doc.setFillColor(10, 10, 10);
  doc.roundedRect(W - margin - 70, y, 70, 20, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('TOTAL DUE', W - margin - 5, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`GHS ${payment.amount.toLocaleString()}`, W - margin - 5, y + 16, { align: 'right' });

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (payment.description && payment.description.length > 60) {
    y += 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text('NOTES', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(black);
    const noteLines = doc.splitTextToSize(payment.description, W - margin * 2);
    doc.text(noteLines, margin, y + 6);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = 272;
  doc.setFillColor(243, 244, 246);
  doc.rect(0, footerY, W, 25, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('Thank you for your business.', margin, footerY + 8);
  doc.text('TGNE — Premium Web Solutions', margin, footerY + 14);

  doc.setTextColor(180, 180, 180);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W - margin, footerY + 14, { align: 'right' });

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`${payment.invoiceNumber}-${client.businessName.replace(/\s+/g, '-')}.pdf`);
}
